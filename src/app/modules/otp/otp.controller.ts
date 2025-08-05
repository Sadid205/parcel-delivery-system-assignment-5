import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { OTPService } from "./otp.service";
import { sendResponse } from "../../utils/sendResponse";

const sendOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, name } = req.body;
    await OTPService.sendOtp(email, name);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP Sent Successfully",
      data: null,
    });
  }
);
const verifyOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    await OTPService.verifyOtp(email, otp);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP verified Successfully",
      data: null,
    });
  }
);

export const OTPController = {
  sendOtp,
  verifyOtp,
};
