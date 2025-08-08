import { Types } from "mongoose";

export enum Status {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  DISPATCHED = "DISPATCHED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
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
  location?: string;
  paid_status: IPaidStatus;
}

export interface IReceiver {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface IParcel {
  sender: Types.ObjectId;
  receiver: IReceiver;
  tracking_number: string;
  weight: number;
  fees: number;
  delivery_date: Date;
  current_status: Types.ObjectId;
  trackingEvents: IParcelStatus[];
  parcel_type: IParcelType;
  description?: string;
  createdAt: Date;
  assignedTo?: Types.ObjectId;
}
