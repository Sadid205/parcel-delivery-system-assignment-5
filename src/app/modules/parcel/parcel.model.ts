import { model, Schema } from "mongoose";
import {
  IPaidStatus,
  IParcel,
  IParcelStatus,
  IParcelType,
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
  },
  { timestamps: true, versionKey: false }
);

export const ParcelStatus = model<IParcelStatus>(
  "ParcelStatus",
  parcelStatusSchema
);

const parcelSchema = new Schema<IParcel>(
  {
    sender: { type: Schema.ObjectId, ref: "User", required: true },
    receiver: { type: String, required: true },
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
    location: { type: String, required: true },
    parcel_type: {
      type: String,
      enum: Object.values(IParcelType),
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const Parcel = model<IParcel>("Parcel", parcelSchema);
