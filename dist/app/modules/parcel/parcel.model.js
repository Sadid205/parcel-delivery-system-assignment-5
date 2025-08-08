"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parcel = exports.parcelSchema = exports.ParcelStatus = void 0;
const mongoose_1 = require("mongoose");
const parcel_interface_1 = require("./parcel.interface");
const parcelStatusSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: Object.values(parcel_interface_1.Status),
        default: parcel_interface_1.Status.REQUESTED,
    },
    paid_status: {
        type: String,
        enum: Object.values(parcel_interface_1.IPaidStatus),
        default: parcel_interface_1.IPaidStatus.UNPAID,
    },
    location: { type: String, required: false },
}, { timestamps: true, versionKey: false });
exports.ParcelStatus = (0, mongoose_1.model)("ParcelStatus", parcelStatusSchema);
const receiverSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
});
exports.parcelSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.ObjectId, ref: "User", required: true },
    receiver: receiverSchema,
    tracking_number: { type: String, required: true },
    weight: { type: Number, required: true },
    fees: { type: Number, required: true },
    delivery_date: { type: Date, required: true },
    current_status: {
        type: mongoose_1.Schema.ObjectId,
        ref: "ParcelStatus",
        required: true,
    },
    trackingEvents: [parcelStatusSchema],
    parcel_type: {
        type: String,
        enum: Object.values(parcel_interface_1.IParcelType),
        required: true,
    },
    description: { type: String, required: false },
    assignedTo: { type: mongoose_1.Schema.ObjectId, ref: "User", required: false },
}, { timestamps: true, versionKey: false });
exports.Parcel = (0, mongoose_1.model)("Parcel", exports.parcelSchema);
