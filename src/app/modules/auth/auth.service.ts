import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppErrors";
import { sendEmail } from "../../utils/sendEmail";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { IAuthProvider, IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );
  return {
    accessToken: newAccessToken,
  };
};
const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(decodedToken.userId);
  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    user!.password as string
  );
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old Password Does Not Match");
  }
  user!.password = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
  );
  user!.save();
};
const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User Not Found");
  }
  if (
    user.password &&
    user.auths.some(
      (providerObject) => providerObject.provider === "credentials"
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You Have Already Set Your Passwrod. Now You Can Change The Password From You Profile Password Update"
    );
  }
  if (
    user.auths.some((providerObject) => providerObject.provider === "google")
  ) {
    const hashedPassword = await bcryptjs.hash(
      plainPassword,
      Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
    );
    const credentialsProvider: IAuthProvider = {
      provider: "credentials",
      providerId: user.email,
    };
    const auths: IAuthProvider[] = [...user.auths, credentialsProvider];
    user.auths = auths;
    await user.save();
  }
  return {};
};
const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });
  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist");
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User Is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, `User Is Deleted`);
  }
  if (!isUserExist.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, `User Is Not Verified`);
  }
  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const resetToken = jwt.sign(jwtPayload, envVars.JWT.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });
  const resetUILink = `${envVars.FRONTEND_URL}/public/reset-password?id=${isUserExist._id}&token=${resetToken}`;
  sendEmail({
    to: isUserExist.email,
    subject: "Password Reset",
    templateName: "forgotPassword",
    templateData: {
      name: isUserExist.name,
      resetUILink,
    },
  });
};
const resetPassword = async (
  paylaod: Record<string, any>,
  decodedToken: JwtPayload
) => {
  if (paylaod.id != decodedToken.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You Can Not Reset Your Password"
    );
  }
  const isUserExist = await User.findById(paylaod.id);
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist");
  }
  const hashedPassword = await bcryptjs.hash(
    paylaod.password,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
  );
  isUserExist.password = hashedPassword;
  await isUserExist.save();
  return {};
};
export const AuthServices = {
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
};
