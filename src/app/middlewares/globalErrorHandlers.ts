import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { envVars } from "../config/env";
import { TErrorSources, TMongooseErrorSource } from "../interfaces/error.types";
import { handleDuplicateKeyError } from "../helpers/handleDuplicateKeyError";

export const globalErrorhandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errorSources: TErrorSources[] | TMongooseErrorSource[] = [];
  let statusCode = 500;
  let message = `Something Went Wrong!!`;
  // duplicate key error
  if (err.code === 11000) {
    const simplyfiedError = handleDuplicateKeyError(err);
    statusCode = simplyfiedError.statusCode;
    message = simplyfiedError.message;
    errorSources = simplyfiedError.errorSources!;
  }
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
