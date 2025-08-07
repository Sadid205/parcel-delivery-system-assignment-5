import { Types } from "mongoose";

export enum Status {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  DISPATCHED = "DISPATCHED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVARED = "DELIVARED",
  CANCELLED = "CANCELLED",
  BLOCKED = "BLOCKED",
  RETURNED = "RETURNED",
  RESHEDULED = "RESHEDULED",
}

export enum IPaidStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
}

export enum IParcelType {
  DOCUMENT = "DOCUMENT",
  BOX = "BOX",
  FRAGILE = "FRAGILE",
  LIQUIED = "LIQUID",
  FOOD = "FOOD",
  ELECTRONICS = "ELECTRONICS",
  OTHER = "OTHER",
}

export interface IParcelStatus {
  status: Status;
  location: string;
  timeStamp: Date;
  paid_status: IPaidStatus;
}

export interface IParcel {
  sender: Types.ObjectId;
  receiver: string;
  tracking_number: string;
  weight: number;
  fees: number;
  delivery_date: Date;
  current_status: Types.ObjectId;
  trackingEvents: IParcelStatus[];
  location: string;
  parcel_type: IParcelType;
}
