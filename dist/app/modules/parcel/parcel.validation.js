"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.sendOtpSchema = exports.assignParcelSchema = exports.updateParcelStatusSchema = exports.updateParcelZodSchema = exports.createParcelZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const parcel_interface_1 = require("./parcel.interface");
const luxon_1 = require("luxon");
exports.createParcelZodSchema = zod_1.default.object({
    receiver: zod_1.default.object({
        name: zod_1.default
            .string({ invalid_type_error: "Name Must Be String" })
            .min(5, { message: "Name Must Be At Least 5 Characters Long." })
            .max(100, { message: "Name Cannot Exceed 100 Characters." }),
        email: zod_1.default
            .string({ invalid_type_error: "Receiver Email must be string" })
            .email({ message: "Invalid Email Address Format" })
            .min(10, { message: "Receiver Email Must Be At Least 5 Charecter Long" })
            .max(100, {
            message: "Receiver Email Can Not Exceed 100 Charecters Long",
        }),
        phone: zod_1.default
            .string({ invalid_type_error: "Phone Number must be string" })
            .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        }),
        address: zod_1.default
            .string({ invalid_type_error: "Address Must Be String" })
            .min(5, { message: "Address Must Be At Least 5 Characters Long." })
            .max(100, { message: "Address Cannot Exceed 100 Characters." }),
    }),
    description: zod_1.default
        .string({ invalid_type_error: "Description Must Be String" })
        .min(5, { message: "Description Must Be At Least 5 Characters Long." })
        .max(100, { message: "Description Cannot Exceed 100 Characters." })
        .optional(),
    weight: zod_1.default
        .number({ invalid_type_error: "Weight Must Be Number" })
        .min(1, { message: "Weight Must Be At Least 1 Gram" })
        .max(10000, { message: "Weight Can Not Exceed 10,000 grams (10kg)" }),
    parcel_type: zod_1.default.enum(Object.values(parcel_interface_1.IParcelType)),
});
exports.updateParcelZodSchema = zod_1.default.object({
    receiver: exports.createParcelZodSchema.shape.receiver.partial().optional(),
    description: exports.createParcelZodSchema.shape.description.optional(),
    weight: exports.createParcelZodSchema.shape.weight.optional(),
    parcel_type: exports.createParcelZodSchema.shape.parcel_type.optional(),
});
exports.updateParcelStatusSchema = zod_1.default
    .object({
    fees: zod_1.default
        .number({ invalid_type_error: "Fees Must Be Number" })
        .min(50, { message: "Fees Must Be At Least 50 Taka" })
        .max(1000, { message: "Fees Can Not Exceed 1000 Taka" }),
    delivery_date: zod_1.default.preprocess((arg) => {
        const jsDate = new Date(arg);
        if (isNaN(jsDate.getTime()))
            return arg;
        return jsDate;
    }, zod_1.default
        .date({ invalid_type_error: "Delivery Date Must Be A Valid Date" })
        .refine((date) => {
        const tomorrowBD = luxon_1.DateTime.now()
            .setZone("Asia/Dhaka")
            .startOf("day")
            .plus({ day: 1 });
        return (luxon_1.DateTime.fromJSDate(date).setZone("Asia/Dhaka") >= tomorrowBD);
    }, {
        message: "Delivery Date Must Be At Least Tomorrow (Bangladesh Time)",
    })),
    status: zod_1.default.enum(Object.values(parcel_interface_1.Status)),
    paid_status: zod_1.default.enum(Object.values(parcel_interface_1.IPaidStatus)),
})
    .partial();
exports.assignParcelSchema = zod_1.default.object({
    tracking_number: zod_1.default.string().regex(/^TRK-\d{13}-\d{3}$/, {
        message: "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
    }),
});
exports.sendOtpSchema = zod_1.default.object({
    tracking_number: zod_1.default.string().regex(/^TRK-\d{13}-\d{3}$/, {
        message: "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
    }),
});
exports.verifyOtpSchema = zod_1.default.object({
    otp: zod_1.default
        .string()
        .length(6, { message: "OTP must be exactly 6 digits" })
        .regex(/^\d{6}$/, { message: "OTP must contain only digits" }),
    tracking_number: zod_1.default.string().regex(/^TRK-\d{13}-\d{3}$/, {
        message: "Invalid Tracking Number Format. Expected: TRK-<13digits>-<3digits>",
    }),
});
