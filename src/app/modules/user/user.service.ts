import { envVars } from "../../config/env";
import { IAuthProvider, IUser, Role } from "./user.interface";
import bcryptjs from "bcryptjs";
import { User } from "./user.model";
import { QueryBuilder } from "../../utils/queryBuilder";
import { userSearchableFields } from "./user.constant";
import { decode, JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppErrors";
import httpStatus from "http-status-codes";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user: IUser = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  });
  return user;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const users = queryBuilder
    .search(userSearchableFields)
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    users.build(),
    queryBuilder.getMeta(),
  ]);
  return {
    data,
    meta,
  };
};
const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (![Role.ADMIN, Role.SUPER_ADMIN].includes(decodedToken.role)) {
    if (decodedToken.userId != userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }
  }
  const isUserExist = await User.findById(userId);
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (
    decodedToken.role === Role.ADMIN &&
    isUserExist.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You Are Not Authorized");
  }
  if (
    payload.role &&
    [Role.USER, Role.DELIVERY_MAN].includes(decodedToken.role)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You Are Not Authorized");
  }
  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if ([Role.USER, Role.DELIVERY_MAN].includes(decodedToken.role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You Are Not Authorized");
    }
  }
  if (payload.password) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You Are Not Authorized");
  }
  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  return newUpdatedUser;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  getMe,
  updateUser,
};
