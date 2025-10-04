import { model, Schema } from "mongoose";
import {
  IPaidStatus,
  IParcel,
  IParcelStatus,
  IParcelType,
  IReceiver,
  Status,
} from "./parcel.interface";
import { string } from "zod";

const parcelStatusSchema = new Schema<IParcelStatus>(
  {
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.REQUESTED,
    },
    paid_status: {
      type: String,
      enum: Object.values(IPaidStatus),
      default: IPaidStatus.UNPAID,
    },
    location: { type: String, required: false },
  },
  { timestamps: true, versionKey: false }
);

export const ParcelStatus = model<IParcelStatus>(
  "ParcelStatus",
  parcelStatusSchema
);

const receiverSchema = new Schema<IReceiver>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
});

export const parcelSchema = new Schema<IParcel>(
  {
    sender: { type: Schema.ObjectId, ref: "User", required: true },
    receiver: receiverSchema,
    tracking_number: { type: String, required: true },
    weight: { type: Number, required: true },
    fees: { type: Number, required: true },
    delivery_date: { type: Date, required: true },
    current_status: {
      type: Schema.ObjectId,
      ref: "ParcelStatus",
      required: true,
    },
    trackingEvents: [parcelStatusSchema],
    parcel_type: {
      type: String,
      enum: Object.values(IParcelType),
      required: true,
    },
    description: { type: String, required: false },
    assignedTo: { type: Schema.ObjectId, ref: "User", required: false },
  },
  { timestamps: true, versionKey: false }
);

export const Parcel = model<IParcel>("Parcel", parcelSchema);
