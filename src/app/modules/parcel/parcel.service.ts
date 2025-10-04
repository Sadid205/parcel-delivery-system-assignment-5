import httpStatus from "http-status-codes";
import { DateTime } from "luxon";
import mongoose from "mongoose";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppErrors";
import { getTrackingNumber } from "../../utils/getTrackingNumber";
import { QueryBuilder } from "../../utils/queryBuilder";
import { sendEmail } from "../../utils/sendEmail";
import { generateOTP, OTP_EXPIRATION } from "../otp/otp.service";
import { IUser, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { parcelSearchableFields } from "./parcel.constant";
import {
  IPaidStatus,
  IParcel,
  IParcelStatus,
  Status,
} from "./parcel.interface";
import { Parcel, ParcelStatus } from "./parcel.model";

const createParcel = async (payload: Partial<IParcel>, userId: string) => {
  const { email, name, phone, address } = payload.receiver!;
  const { weight, ...rest2 } = payload;
  const user = await User.findById(userId);
  const tracking_number = getTrackingNumber();
  const fees = 0.5 * weight!;
  const delivery_date = DateTime.now()
    .setZone("Asia/Dhaka")
    .startOf("day")
    .plus({ day: 3 })
    .toJSDate();
  const current_status = await ParcelStatus.create({
    paid_status: IPaidStatus.UNPAID,
    status: Status.REQUESTED,
  });
  const newParcel = await Parcel.create({
    sender: user?._id,
    receiver: {
      name,
      email,
      phone,
      address,
    },
    tracking_number,
    weight,
    fees,
    delivery_date,
    current_status: current_status._id,
    trackingEvents: [current_status],
    ...rest2,
  });

  const adminUsers = await User.find({
    role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] },
  }).select("name email");
  await Promise.all(
    adminUsers.map((admin: { name: string; email: string }) => {
      const adminPayload = {
        adminName: admin.name,
        senderName: user?.name,
        senderEmail: user?.email,
        receiverEmail: email,
        receiverPhone: phone,
        receiverAddress: address,
        parcelType: newParcel.parcel_type,
        weight: newParcel.weight,
        price: newParcel.fees,
        trackingId: newParcel.tracking_number,
        description: newParcel.description,
        createdAt: newParcel.createdAt,
        currentStatus: current_status.status,
        paidStatus: current_status.paid_status,
      };
      return sendEmail({
        to: admin.email,
        subject: "New Parcel Request",
        templateName: "parcelAdmin",
        templateData: adminPayload,
      });
    })
  );
  const senderAndReceiverPayload = {
    senderName: user?.name,
    senderEmail: user?.email,
    emailReceiverName: "",
    receiverName: name,
    receiverEmail: email,
    receiverPhone: phone,
    receiverAddress: address,

    parcelType: newParcel.parcel_type,
    weight: newParcel.weight,
    description: newParcel.description,
    price: newParcel.fees,
    trackingId: newParcel.tracking_number,
    createdAt: newParcel.createdAt,
    currentStatus: current_status.status,
    paidStatus: current_status.paid_status,
  };
  const sender = sendEmail({
    to: user?.email as string,
    subject: "Parcel Submission Confirmation",
    templateName: "parcelSenderAndReceiver",
    templateData: {
      ...senderAndReceiverPayload,
      emailReceiverName: user?.name,
    },
  });
  const receiver = sendEmail({
    to: email,
    subject: "A Parcel Has Been Sent to You",
    templateName: "parcelSenderAndReceiver",
    templateData: { ...senderAndReceiverPayload, emailReceiverName: name },
  });
  await Promise.all([sender, receiver]);

  return newParcel;
};

const getAllParcel = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Parcel.find().populate("current_status", null),
    query
  );
  const parcels = queryBuilder
    .search(parcelSearchableFields)
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    parcels.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
const getParcelHistory = async (
  userId: string,
  query: Record<string, string>
) => {
  const user = await User.findById(userId);

  const parcelsQuery = Parcel.find({
    $or: [{ sender: userId }, { "receiver.email": user?.email }],
  }).populate("current_status", null);

  const queryBuilder = new QueryBuilder(parcelsQuery, query);
  const parcels = queryBuilder
    .filter()
    .search(parcelSearchableFields)
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    parcels.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
const cancelParcel = async (tracking_number: string, userId: string) => {
  const user = await User.findById(userId);
  const parcel = await Parcel.findOne({
    sender: user?._id,
    tracking_number,
  }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if (
    ![Status.REQUESTED, Status.APPROVED, Status.RESCHEDULED].includes(
      currentStatus.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Cancel Now`
    );
  }
  currentStatus.status = Status.CANCELLED;
  parcel.trackingEvents = [...parcel.trackingEvents, currentStatus];
  await currentStatus.save();
  await parcel.save();
};
const updateParcelStatus = async (
  tracking_number: string,
  payload: {
    fees?: number;
    delivery_date?: Date;
    status?: Status;
    paid_status?: IPaidStatus;
  }
) => {
  const { status, paid_status, fees, delivery_date } = payload;
  const parcel = await Parcel.findOne({ tracking_number: tracking_number })
    .populate<{
      current_status: IParcelStatus;
    }>("current_status", "status paid_status")
    .populate<{ sender: IUser }>("sender", null);
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if ([Status.CANCELLED, Status.DELIVERED].includes(currentStatus.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Update Now`
    );
  }
  if (status) {
    if (status === currentStatus.status) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Your Parcel Is Already ${status}.`
      );
    }
    currentStatus.status = status;
  }
  if (paid_status) {
    // if (paid_status === IPaidStatus.PAID) {
    //   throw new AppError(
    //     httpStatus.BAD_REQUEST,
    //     `Your Parcel Is Already ${paid_status}.`
    //   );
    // }
    currentStatus.paid_status = paid_status;
  }
  if (fees) {
    parcel.fees = fees;
  }
  if (delivery_date) {
    parcel.delivery_date = delivery_date;
  }
  parcel.current_status = currentStatus;
  parcel.trackingEvents = [...(parcel.trackingEvents ?? []), currentStatus];
  await currentStatus.save();
  await parcel.save();
  const templateData = {
    tracking_number: parcel.tracking_number,
    status: currentStatus.status,
    paid_status: currentStatus.paid_status,
    fees: parcel.fees,
    delivery_date: parcel.delivery_date,
    email_receiver_name: "",
    sender_email: parcel.sender.email,
    receiver_name: parcel.receiver.name,
    receiver_address: parcel.receiver.address,
    receiver_phone: parcel.receiver.phone,
    receiver_email: parcel.receiver.email,
    date: DateTime.now().toLocaleString(DateTime.DATE_MED),
    time: DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS),
  };
  await Promise.all([
    sendEmail({
      to: parcel.receiver.email,
      subject: "Parcel Status Update",
      templateName: "parcelStatusUpdate",
      templateData: {
        ...templateData,
        email_receiver_name: parcel.receiver.name,
      },
    }),
    sendEmail({
      to: parcel.sender.email,
      subject: "Parcel Status Update",
      templateName: "parcelStatusUpdate",
      templateData: {
        ...templateData,
        email_receiver_name: parcel.sender.name,
      },
    }),
  ]);
  return parcel;
};
const assignParcel = async (
  tracking_number: string,
  id: string,
  userId: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  const userObjectId = new mongoose.Types.ObjectId(id);
  const delivery_man = await User.findOne({
    _id: userObjectId,
    role: Role.DELIVERY_MAN,
  });
  if (!delivery_man) {
    throw new AppError(httpStatus.NOT_FOUND, "Delivary Man Not Found");
  }
  const parcel = await Parcel.findOne({ tracking_number })
    .populate<{
      current_status: IParcelStatus;
    }>("current_status", "status")
    .populate<{ sender: IUser }>("sender", "name phone address");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if (
    [
      Status.CANCELLED,
      Status.DELIVERED,
      Status.RETURNED,
      Status.BLOCKED,
    ].includes(currentStatus.status)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Assign Now`
    );
  }
  const isAlreadyAssigned = delivery_man.assignedParcels?.includes(parcel._id);
  if (isAlreadyAssigned) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This Parcel Is Already Assigned To This Delivery Man"
    );
  }
  if (parcel.assignedTo) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This Parcel Is Already Assigned To A Delivery Man"
    );
  }

  parcel.assignedTo = delivery_man._id;
  delivery_man.assignedParcels = [
    ...(delivery_man.assignedParcels || []),
    parcel._id,
  ];
  await parcel.save();
  await delivery_man.save();

  const templateData = {
    parcel: {
      tracking_number: parcel.tracking_number,
      sender_name: parcel.sender.name,
      sender_phone: parcel.sender.phone,
      sender_address: parcel.sender.address,
      recipient_name: parcel.receiver.name,
      recipient_phone: parcel.receiver.phone,
      recipient_address: parcel.receiver.address,
      weight: parcel.weight,
      status: "Assigned",
      assigned_date: DateTime.now().toLocaleString(DateTime.DATE_MED),
    },
    deliveryMan: {
      name: delivery_man.name,
      phone: delivery_man.phone,
      email: delivery_man.email,
    },
    assignedBy: {
      name: user.name,
      email: user.email,
    },
  };

  await Promise.all([
    sendEmail({
      to: delivery_man.email,
      subject: "Parcel Assign Confirmation",
      templateName: "assignedParcelDeliveryMan",
      templateData,
    }),
    sendEmail({
      to: user.email,
      subject: "Parcel Assign Confirmation",
      templateName: "assignedParcelAdmin",
      templateData,
    }),
  ]);

  return null;
};
const updateParcel = async (
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    description?: string;
    weight?: number;
  },
  tracking_number: string,
  userId: string
) => {
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found!");
  }

  if (parcel.sender.toString() != userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You Can Not Update This Parcel"
    );
  }

  if (
    ![Status.REQUESTED, Status.APPROVED, Status.RESCHEDULED].includes(
      parcel.current_status.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${parcel.current_status.status} .You Can Not Update Now`
    );
  }
  const updatedParcel = await Parcel.findOneAndUpdate(
    { tracking_number },
    { ...payload },
    { new: true }
  );
  return updatedParcel;
};

const getAssignedParcel = async (userId: string) => {
  const user = await User.findOne({
    _id: userId,
    role: Role.DELIVERY_MAN,
  }).populate<{ assignedParcels: IParcel[] }>({
    path: "assignedParcels",
    populate: {
      path: "current_status",
    },
  });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  const assignedParcles = Array.isArray(user.assignedParcels)
    ? user.assignedParcels
    : [];

  const filteredAssignedParcel = assignedParcles.filter(
    (parcel) =>
      (parcel.current_status as unknown as IParcelStatus)?.status !==
      Status.DELIVERED
  );
  return filteredAssignedParcel;
};
const sendOtp = async (tracking_number: string) => {
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status paid_status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if (currentStatus.status === Status.DELIVERED) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Is Already Delivered");
  }
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }

  const { email, name } = parcel.receiver;
  const otp = generateOTP();
  const redisKey = `otp:${email}`;
  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });
  await sendEmail({
    to: email,
    subject: "Your Parcel Confirmation OTP Code",
    templateName: "otp",
    templateData: {
      name,
      otp,
    },
  });
  return null;
};

const verifyOtp = async (
  otp: string,
  tracking_number: string,
  userId: string
) => {
  const delivery_man = await User.findOne({
    _id: userId,
    role: Role.DELIVERY_MAN,
  });
  if (!delivery_man) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status paid_status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if (currentStatus.status === Status.DELIVERED) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Is Already Delivered");
  }
  const { email, name } = parcel.receiver;
  const redisKey = `otp:${email}`;
  const savedOtp = await redisClient.get(redisKey);
  if (!savedOtp) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid OTP");
  }
  if (savedOtp !== otp) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid OTP");
  }
  currentStatus.status = Status.DELIVERED;
  currentStatus.paid_status = IPaidStatus.PAID;
  parcel.current_status = currentStatus;
  parcel.trackingEvents = [...(parcel.trackingEvents ?? []), currentStatus];
  await currentStatus.save();
  await parcel.save();

  const receiverEmailData = {
    receiverName: parcel.receiver.name,
    trackingNumber: parcel.tracking_number,
  };
  const deliveryManEmailData = {
    deliveryManName: delivery_man.name,
    trackingNumber: parcel.tracking_number,
    receiverName: parcel.receiver.name,
    receiverEmail: parcel.receiver.email,
    deliveryDate: DateTime.now().toLocaleString(DateTime.DATE_MED),
  };
  await Promise.all([
    sendEmail({
      to: delivery_man.email,
      subject: "Parcel Delivery Successfull",
      templateData: deliveryManEmailData,
      templateName: "successDeliveryMan",
    }),
    sendEmail({
      to: parcel.receiver.email,
      subject: "Parcel Delivery Confirmation",
      templateData: receiverEmailData,
      templateName: "successReceiver",
    }),
  ]);
  return parcel;
};
const getSingleParcel = async (tracking_number: string) => {
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status paid_status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  return parcel;
};

export const ParcelService = {
  createParcel,
  getAllParcel,
  getParcelHistory,
  cancelParcel,
  updateParcelStatus,
  sendOtp,
  verifyOtp,
  assignParcel,
  getAssignedParcel,
  updateParcel,
  getSingleParcel,
};
