"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const luxon_1 = require("luxon");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_config_1 = require("../../config/redis.config");
const AppErrors_1 = __importDefault(require("../../errorHelpers/AppErrors"));
const getTrackingNumber_1 = require("../../utils/getTrackingNumber");
const queryBuilder_1 = require("../../utils/queryBuilder");
const sendEmail_1 = require("../../utils/sendEmail");
const otp_service_1 = require("../otp/otp.service");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const parcel_constant_1 = require("./parcel.constant");
const parcel_interface_1 = require("./parcel.interface");
const parcel_model_1 = require("./parcel.model");
const createParcel = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, phone, address } = payload.receiver;
    const { weight } = payload, rest2 = __rest(payload, ["weight"]);
    const user = yield user_model_1.User.findById(userId);
    const tracking_number = (0, getTrackingNumber_1.getTrackingNumber)();
    const fees = 0.5 * weight;
    const delivery_date = luxon_1.DateTime.now()
        .setZone("Asia/Dhaka")
        .startOf("day")
        .plus({ day: 3 })
        .toJSDate();
    const current_status = yield parcel_model_1.ParcelStatus.create({
        paid_status: parcel_interface_1.IPaidStatus.UNPAID,
        status: parcel_interface_1.Status.REQUESTED,
    });
    const newParcel = yield parcel_model_1.Parcel.create(Object.assign({ sender: user === null || user === void 0 ? void 0 : user._id, receiver: {
            name,
            email,
            phone,
            address,
        }, tracking_number,
        weight,
        fees,
        delivery_date, current_status: current_status._id, trackingEvents: [current_status] }, rest2));
    const adminUsers = yield user_model_1.User.find({
        role: { $in: [user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN] },
    }).select("name email");
    yield Promise.all(adminUsers.map((admin) => {
        const adminPayload = {
            adminName: admin.name,
            senderName: user === null || user === void 0 ? void 0 : user.name,
            senderEmail: user === null || user === void 0 ? void 0 : user.email,
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
        return (0, sendEmail_1.sendEmail)({
            to: admin.email,
            subject: "New Parcel Request",
            templateName: "parcelAdmin",
            templateData: adminPayload,
        });
    }));
    const senderAndReceiverPayload = {
        senderName: user === null || user === void 0 ? void 0 : user.name,
        senderEmail: user === null || user === void 0 ? void 0 : user.email,
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
    const sender = (0, sendEmail_1.sendEmail)({
        to: user === null || user === void 0 ? void 0 : user.email,
        subject: "Parcel Submission Confirmation",
        templateName: "parcelSenderAndReceiver",
        templateData: Object.assign(Object.assign({}, senderAndReceiverPayload), { emailReceiverName: user === null || user === void 0 ? void 0 : user.name }),
    });
    const receiver = (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "A Parcel Has Been Sent to You",
        templateName: "parcelSenderAndReceiver",
        templateData: Object.assign(Object.assign({}, senderAndReceiverPayload), { emailReceiverName: name }),
    });
    yield Promise.all([sender, receiver]);
    return newParcel;
});
const getAllParcel = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new queryBuilder_1.QueryBuilder(parcel_model_1.Parcel.find().populate("current_status", null), query);
    const parcels = queryBuilder
        .search(parcel_constant_1.parcelSearchableFields)
        .filter()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        parcels.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getParcelHistory = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    const parcelsQuery = parcel_model_1.Parcel.find({
        $or: [{ sender: userId }, { "sender.email": user === null || user === void 0 ? void 0 : user.email }],
    }).populate("current_status", null);
    const queryBuilder = new queryBuilder_1.QueryBuilder(parcelsQuery, query);
    const parcels = queryBuilder
        .filter()
        .search(parcel_constant_1.parcelSearchableFields)
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        parcels.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getIncomingParcel = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    const parcelsQuery = parcel_model_1.Parcel.find({
        $or: [{ sender: userId }, { "receiver.email": user === null || user === void 0 ? void 0 : user.email }],
    }).populate("current_status", null);
    const queryBuilder = new queryBuilder_1.QueryBuilder(parcelsQuery, query);
    const parcels = queryBuilder
        .filter()
        .search(parcel_constant_1.parcelSearchableFields)
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        parcels.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const cancelParcel = (tracking_number, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    const parcel = yield parcel_model_1.Parcel.findOne({
        sender: user === null || user === void 0 ? void 0 : user._id,
        tracking_number,
    }).populate("current_status", "status");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const currentStatus = parcel_model_1.ParcelStatus.hydrate(parcel.current_status);
    if (![parcel_interface_1.Status.REQUESTED, parcel_interface_1.Status.APPROVED, parcel_interface_1.Status.RESCHEDULED].includes(currentStatus.status)) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `Your Parcel Is ${currentStatus.status} .You Can Not Cancel Now`);
    }
    currentStatus.status = parcel_interface_1.Status.CANCELLED;
    parcel.trackingEvents = [...parcel.trackingEvents, currentStatus];
    yield currentStatus.save();
    yield parcel.save();
});
const updateParcelStatus = (tracking_number, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { status, paid_status, fees, delivery_date } = payload;
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number: tracking_number })
        .populate("current_status", "status paid_status")
        .populate("sender", null);
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const currentStatus = parcel_model_1.ParcelStatus.hydrate(parcel.current_status);
    if ([parcel_interface_1.Status.CANCELLED, parcel_interface_1.Status.DELIVERED].includes(currentStatus.status)) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `Your Parcel Is ${currentStatus.status} .You Can Not Update Now`);
    }
    if (status) {
        if (status === currentStatus.status) {
            throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `Your Parcel Is Already ${status}.`);
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
    parcel.trackingEvents = [...((_a = parcel.trackingEvents) !== null && _a !== void 0 ? _a : []), currentStatus];
    yield currentStatus.save();
    yield parcel.save();
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
        date: luxon_1.DateTime.now().toLocaleString(luxon_1.DateTime.DATE_MED),
        time: luxon_1.DateTime.now().toLocaleString(luxon_1.DateTime.TIME_WITH_SECONDS),
    };
    yield Promise.all([
        (0, sendEmail_1.sendEmail)({
            to: parcel.receiver.email,
            subject: "Parcel Status Update",
            templateName: "parcelStatusUpdate",
            templateData: Object.assign(Object.assign({}, templateData), { email_receiver_name: parcel.receiver.name }),
        }),
        (0, sendEmail_1.sendEmail)({
            to: parcel.sender.email,
            subject: "Parcel Status Update",
            templateName: "parcelStatusUpdate",
            templateData: Object.assign(Object.assign({}, templateData), { email_receiver_name: parcel.sender.name }),
        }),
    ]);
    return parcel;
});
const assignParcel = (tracking_number, id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    const userObjectId = new mongoose_1.default.Types.ObjectId(id);
    const delivery_man = yield user_model_1.User.findOne({
        _id: userObjectId,
        role: user_interface_1.Role.DELIVERY_MAN,
    });
    if (!delivery_man) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Delivary Man Not Found");
    }
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number })
        .populate("current_status", "status")
        .populate("sender", "name phone address");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const currentStatus = parcel_model_1.ParcelStatus.hydrate(parcel.current_status);
    if ([
        parcel_interface_1.Status.CANCELLED,
        parcel_interface_1.Status.DELIVERED,
        parcel_interface_1.Status.RETURNED,
        parcel_interface_1.Status.BLOCKED,
    ].includes(currentStatus.status)) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `Your Parcel Is ${currentStatus.status} .You Can Not Assign Now`);
    }
    const isAlreadyAssigned = (_a = delivery_man.assignedParcels) === null || _a === void 0 ? void 0 : _a.includes(parcel._id);
    if (isAlreadyAssigned) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, "This Parcel Is Already Assigned To This Delivery Man");
    }
    if (parcel.assignedTo) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, "This Parcel Is Already Assigned To A Delivery Man");
    }
    parcel.assignedTo = delivery_man._id;
    delivery_man.assignedParcels = [
        ...(delivery_man.assignedParcels || []),
        parcel._id,
    ];
    yield parcel.save();
    yield delivery_man.save();
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
            assigned_date: luxon_1.DateTime.now().toLocaleString(luxon_1.DateTime.DATE_MED),
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
    yield Promise.all([
        (0, sendEmail_1.sendEmail)({
            to: delivery_man.email,
            subject: "Parcel Assign Confirmation",
            templateName: "assignedParcelDeliveryMan",
            templateData,
        }),
        (0, sendEmail_1.sendEmail)({
            to: user.email,
            subject: "Parcel Assign Confirmation",
            templateName: "assignedParcelAdmin",
            templateData,
        }),
    ]);
    return null;
});
const updateParcel = (payload, tracking_number, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number }).populate("current_status", "status");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found!");
    }
    if (parcel.sender.toString() != userId) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Can Not Update This Parcel");
    }
    if (![parcel_interface_1.Status.REQUESTED, parcel_interface_1.Status.APPROVED, parcel_interface_1.Status.RESCHEDULED].includes(parcel.current_status.status)) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `Your Parcel Is ${parcel.current_status.status} .You Can Not Update Now`);
    }
    const updatedParcel = yield parcel_model_1.Parcel.findOneAndUpdate({ tracking_number }, Object.assign({}, payload), { new: true });
    return updatedParcel;
});
const getAssignedParcel = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({
        _id: userId,
        role: user_interface_1.Role.DELIVERY_MAN,
    }).populate({
        path: "assignedParcels",
        populate: {
            path: "current_status",
        },
    });
    if (!user) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "Unauthorized");
    }
    const assignedParcles = Array.isArray(user.assignedParcels)
        ? user.assignedParcels
        : [];
    const filteredAssignedParcel = assignedParcles.filter((parcel) => {
        var _a;
        return ((_a = parcel.current_status) === null || _a === void 0 ? void 0 : _a.status) !==
            parcel_interface_1.Status.DELIVERED;
    });
    return filteredAssignedParcel;
});
const sendOtp = (tracking_number) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number }).populate("current_status", "status paid_status");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const currentStatus = parcel_model_1.ParcelStatus.hydrate(parcel.current_status);
    if (currentStatus.status === parcel_interface_1.Status.DELIVERED) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Is Already Delivered");
    }
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const { email, name } = parcel.receiver;
    const otp = (0, otp_service_1.generateOTP)();
    const redisKey = `otp:${email}`;
    yield redis_config_1.redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX",
            value: otp_service_1.OTP_EXPIRATION,
        },
    });
    yield (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "Your Parcel Confirmation OTP Code",
        templateName: "otp",
        templateData: {
            name,
            otp,
        },
    });
    return null;
});
const verifyOtp = (otp, tracking_number, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const delivery_man = yield user_model_1.User.findOne({
        _id: userId,
        role: user_interface_1.Role.DELIVERY_MAN,
    });
    if (!delivery_man) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number }).populate("current_status", "status paid_status");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    const currentStatus = parcel_model_1.ParcelStatus.hydrate(parcel.current_status);
    if (currentStatus.status === parcel_interface_1.Status.DELIVERED) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Is Already Delivered");
    }
    const { email, name } = parcel.receiver;
    const redisKey = `otp:${email}`;
    const savedOtp = yield redis_config_1.redisClient.get(redisKey);
    if (!savedOtp) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Invalid OTP");
    }
    if (savedOtp !== otp) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Invalid OTP");
    }
    currentStatus.status = parcel_interface_1.Status.DELIVERED;
    currentStatus.paid_status = parcel_interface_1.IPaidStatus.PAID;
    parcel.current_status = currentStatus;
    parcel.trackingEvents = [...((_a = parcel.trackingEvents) !== null && _a !== void 0 ? _a : []), currentStatus];
    yield currentStatus.save();
    yield parcel.save();
    const receiverEmailData = {
        receiverName: parcel.receiver.name,
        trackingNumber: parcel.tracking_number,
    };
    const deliveryManEmailData = {
        deliveryManName: delivery_man.name,
        trackingNumber: parcel.tracking_number,
        receiverName: parcel.receiver.name,
        receiverEmail: parcel.receiver.email,
        deliveryDate: luxon_1.DateTime.now().toLocaleString(luxon_1.DateTime.DATE_MED),
    };
    yield Promise.all([
        (0, sendEmail_1.sendEmail)({
            to: delivery_man.email,
            subject: "Parcel Delivery Successfull",
            templateData: deliveryManEmailData,
            templateName: "successDeliveryMan",
        }),
        (0, sendEmail_1.sendEmail)({
            to: parcel.receiver.email,
            subject: "Parcel Delivery Confirmation",
            templateData: receiverEmailData,
            templateName: "successReceiver",
        }),
    ]);
    return parcel;
});
const getSingleParcel = (tracking_number) => __awaiter(void 0, void 0, void 0, function* () {
    const parcel = yield parcel_model_1.Parcel.findOne({ tracking_number }).populate("current_status", "status paid_status");
    if (!parcel) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "Parcel Not Found");
    }
    return parcel;
});
exports.ParcelService = {
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
    getIncomingParcel,
};
