import crypto from "crypto";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppErrors";
import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";
export const OTP_EXPIRATION = 3 * 60; // 3 minutes
export const generateOTP = (length = 6) => {
  // 6 digit
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length);
  return otp;
};

const sendOtp = async (email: string, name: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(400, "User Not Found");
  }
  if (user.isVerified) {
    throw new AppError(400, "User Already Verified");
  }
  const otp = generateOTP();
  const redisKey = `otp:${email}`;
  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });
  return {};
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(400, "User Not Found");
  }
  if (user.isVerified) {
    throw new AppError(400, "User Already Verified");
  }
  const redisKey = `otp:${email}`;
  const savedOtp = await redisClient.get(redisKey);
  if (!savedOtp) {
    throw new AppError(400, "Invalid OTP");
  }
  if (savedOtp !== otp) {
    throw new AppError(400, "Invalid OTP");
  }
  await Promise.all([
    User.updateOne(
      { email: email },
      { isVerified: true },
      { runValidators: true }
    ),
    redisClient.del([redisKey]),
  ]);
  return {};
};

export const OTPService = {
  sendOtp,
  verifyOtp,
};
