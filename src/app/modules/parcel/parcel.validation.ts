import z, { Schema } from "zod";
import {
  IPaidStatus,
  IParcelStatus,
  IParcelType,
  Status,
} from "./parcel.interface";
import { DateTime } from "luxon";
export const createParcelZodSchema = z.object({
  receiver: z.object({
    name: z
      .string({ invalid_type_error: "Name Must Be String" })
      .min(5, { message: "Name Must Be At Least 5 Characters Long." })
      .max(100, { message: "Name Cannot Exceed 100 Characters." }),
    email: z
      .string({ invalid_type_error: "Receiver Email must be string" })
      .email({ message: "Invalid Email Address Format" })
      .min(10, { message: "Receiver Email Must Be At Least 5 Charecter Long" })
      .max(100, {
        message: "Receiver Email Can Not Exceed 100 Charecters Long",
      }),
    phone: z
      .string({ invalid_type_error: "Phone Number must be string" })
      .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
        message:
          "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
      }),
    address: z
      .string({ invalid_type_error: "Address Must Be String" })
      .min(5, { message: "Address Must Be At Least 5 Characters Long." })
      .max(100, { message: "Address Cannot Exceed 100 Characters." }),
  }),
  description: z
    .string({ invalid_type_error: "Description Must Be String" })
    .min(5, { message: "Description Must Be At Least 5 Characters Long." })
    .max(100, { message: "Description Cannot Exceed 100 Characters." })
    .optional(),
  weight: z
    .number({ invalid_type_error: "Weight Must Be Number" })
    .min(1, { message: "Weight Must Be At Least 1 Gram" })
    .max(10000, { message: "Weight Can Not Exceed 10,000 grams (10kg)" }),
  parcel_type: z.enum(Object.values(IParcelType) as [string]),
});

export const updateParcelZodSchema = z.object({
  receiver: createParcelZodSchema.shape.receiver.partial().optional(),
  description: createParcelZodSchema.shape.description.optional(),
  weight: createParcelZodSchema.shape.weight.optional(),
  parcel_type: createParcelZodSchema.shape.parcel_type.optional(),
});

export const updateParcelStatusSchema = z
  .object({
    fees: z
      .number({ invalid_type_error: "Fees Must Be Number" })
      .min(50, { message: "Fees Must Be At Least 50 Taka" })
      .max(1000, { message: "Fees Can Not Exceed 1000 Taka" }),
    delivery_date: z.preprocess(
      (arg) => {
        const jsDate = new Date(arg as string);
        if (isNaN(jsDate.getTime())) return arg;
        return jsDate;
      },
      z
        .date({ invalid_type_error: "Delivery Date Must Be A Valid Date" })
        .refine(
          (date) => {
            const tomorrowBD = DateTime.now()
              .setZone("Asia/Dhaka")
              .startOf("day")
              .plus({ day: 1 });
            return (
              DateTime.fromJSDate(date).setZone("Asia/Dhaka") >= tomorrowBD
            );
          },
          {
            message:
              "Delivery Date Must Be At Least Tomorrow (Bangladesh Time)",
          }
        )
    ),
    status: z.enum(Object.values(Status) as [string]),
    paid_status: z.enum(Object.values(IPaidStatus) as [string]),
  })
  .partial();

export const assignParcelSchema = z.object({
  tracking_number: z.string().regex(/^TRK-\d{13}-\d{3}$/, {
    message:
      "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
  }),
});

export const sendOtpSchema = z.object({
  tracking_number: z.string().regex(/^TRK-\d{13}-\d{3}$/, {
    message:
      "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
  }),
});

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "OTP must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "OTP must contain only digits" }),
  tracking_number: z.string().regex(/^TRK-\d{13}-\d{3}$/, {
    message:
      "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
  }),
});
