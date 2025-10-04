import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppErrors";
import { IsActive } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;
      if (!accessToken) {
        throw new AppError(httpStatus.NOT_FOUND, "No Token Received");
      }
      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT.JWT_ACCESS_SECRET
      ) as JwtPayload;
      const isUserExist = await User.findOne({
        email: verifiedToken.email,
      });
      if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist!");
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
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted");
      }
      // authRoles = ["ADMIN","SUPER_AMIN"].includes("ADMIN")
      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "You Are Not Permitted To View This Route!"
        );
      }
      req.user = verifiedToken;
      next();
    } catch (error) {
      console.log("jwt error", error);
      next(error);
    }
  };
