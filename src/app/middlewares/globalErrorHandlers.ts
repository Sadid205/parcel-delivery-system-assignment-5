import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { envVars } from "../config/env";

export const globalErrorhandler = async (
  err: any,
  req: Request,
  res: Response
) => {
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: "Something went wront!",
    errorSources: "",
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
