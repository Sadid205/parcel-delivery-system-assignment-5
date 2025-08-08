import { JwtPayload } from "jsonwebtoken";
import {
  IPaidStatus,
  IParcel,
  IParcelStatus,
  Status,
} from "./parcel.interface";
import { User } from "../user/user.model";
import { Parcel, ParcelStatus } from "./parcel.model";
import { getTrackingNumber } from "../../utils/getTrackingNumber";
import { DateTime } from "luxon";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IUser, Role } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { parcelSearchableFields } from "./parcel.constant";
import AppError from "../../errorHelpers/AppErrors";
import httpStatus from "http-status-codes";
import mongoose, { HydratedDocument } from "mongoose";

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
  const queryBuilder = new QueryBuilder(Parcel.find(), query);
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
  });

  const queryBuilder = new QueryBuilder(parcelsQuery, query);
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
    ![Status.REQUESTED, Status.APPROVED, Status.RESHEDULED].includes(
      currentStatus.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Cancel Now`
    );
  }
  currentStatus.status = Status.CANCELLED;
  await currentStatus.save();
};
const updateParcelStatus = async (
  tracking_number: string,
  payload: {
    fees?: number;
    delivary_date?: Date;
    status?: Status;
    paid_status?: IPaidStatus;
  }
) => {
  const { status, paid_status, fees, delivary_date } = payload;
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if ([Status.CANCELLED, Status.DELIVARED].includes(currentStatus.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Update Now`
    );
  }
  if (status) {
    currentStatus.status = status;
  }
  if (paid_status) {
    currentStatus.paid_status = paid_status;
  }
  if (fees) {
    parcel.fees = fees;
  }
  if (delivary_date) {
    parcel.delivery_date = delivary_date;
  }
  await currentStatus.save();
  await parcel.save();
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
  const trackingNumberObjectId = new mongoose.Types.ObjectId(tracking_number);
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
    }>("current_staus", "status")
    .populate<{ sender: IUser }>("sender", "name phone address");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found");
  }
  const currentStatus = ParcelStatus.hydrate(parcel.current_status);
  if (
    [
      Status.CANCELLED,
      Status.DELIVARED,
      Status.RETURNED,
      Status.BLOCKED,
    ].includes(currentStatus.status)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your Parcel Is ${currentStatus.status} .You Can Not Assign Now`
    );
  }
  const isAlreadyAssigned = delivery_man.assignedParcels?.includes(
    trackingNumberObjectId
  );
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

  delivery_man.assignedParcels = [
    ...(delivery_man.assignedParcels || []),
    parcel._id,
  ];
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
  usreId: string
) => {
  const parcel = await Parcel.findOne({ tracking_number }).populate<{
    current_status: IParcelStatus;
  }>("current_status", "status");
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel Not Found!");
  }
  const userObjectId = new mongoose.Types.ObjectId(usreId);
  if (parcel.sender !== userObjectId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You Can Not Update This Parcel"
    );
  }

  if (
    ![Status.REQUESTED, Status.APPROVED, Status.RESHEDULED].includes(
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

const getAssignedParcel = async () => {};
const sendOtp = async () => {};
const verifyOtp = async () => {};

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
};
