import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { envVars } from "../config/env";
import { TErrorSources, TMongooseErrorSource } from "../interfaces/error.types";
import { handleDuplicateKeyError } from "../helpers/handleDuplicateKeyError";
import { handleCastError } from "../helpers/handleCastError";
import { handleZodError } from "../helpers/handleZodError";
import { handleValidationError } from "../helpers/handleValidationError";
import AppError from "../errorHelpers/AppErrors";

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
  } else if (err.name === "CastError") {
    const simplyfiedError = handleCastError(err);
    statusCode = simplyfiedError.statusCode;
    message = simplyfiedError.message;
    errorSources = simplyfiedError.errorSources!;
  } else if (err.name === "ZodError") {
    const simplyfiedError = handleZodError(err);
    statusCode = simplyfiedError.statusCode;
    message = simplyfiedError.message;
    errorSources = simplyfiedError.errorSources!;
  } else if (err.name === "ValidationError") {
    const simplyfiedError = handleValidationError(err);
    statusCode = simplyfiedError.statusCode;
    message = simplyfiedError.message;
    errorSources = simplyfiedError.errorSources!;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
