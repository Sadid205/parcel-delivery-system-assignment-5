import z from "zod";
import { IPaidStatus, IParcelType } from "./parcel.interface";
import { DateTime } from "luxon";
export const createParcelZodSchema = z.object({
  receiver: z
    .string({ invalid_type_error: "Receiver Email must be string" })
    .email({ message: "Invalid Email Address Format" })
    .min(10, { message: "Receiver Email Must Be At Least 5 Charecter Long" })
    .max(100, { message: "Receiver Email Can Not Exceed 100 Charecters Long" }),
  weight: z
    .number({ invalid_type_error: "Weight Must Be Number" })
    .min(1, { message: "Weight Must Be At Least 1 Gram" })
    .max(10000, { message: "Weight Can Not Exceed 10,000 grams (10kg)" }),
  location: z
    .string({ invalid_type_error: "Location Must Be String" })
    .min(5, { message: "Location Must Be At Least 5 Characters Long." })
    .max(100, { message: "Location Cannot Exceed 100 Characters." }),
  parcel_type: z.enum(Object.values(IParcelType) as [string]),
});

export const updateParcelZodSchema = createParcelZodSchema.partial();

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
    current_status: z.enum(Object.values(IPaidStatus) as [string]),
  })
  .partial();
