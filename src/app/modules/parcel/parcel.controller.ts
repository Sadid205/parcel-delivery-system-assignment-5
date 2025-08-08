import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { ParcelService } from "./parcel.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

const createParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newParcel = await ParcelService.createParcel(
      req.body,
      (req.user as JwtPayload).userId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
        "Parcel Has Been Successfully Created And Is Now Being Processed.",
      data: newParcel,
    });
  }
);
const getAllParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await ParcelService.getAllParcel(
      query as Record<string, string>
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Parcel Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getParcelHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await ParcelService.getParcelHistory(
      (req.user as JwtPayload).userId,
      query as Record<string, string>
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your Parcel History Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const cancelParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tracking_number = req.params.tracking_number;
    const result = ParcelService.cancelParcel(
      tracking_number,
      (req.user as JwtPayload).userId
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel Cancelled Successful",
      data: result,
    });
  }
);
const updateParcelStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tracking_number = req.params.tracking_number;
    const result = await ParcelService.updateParcelStatus(
      tracking_number,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel Status Updated Successful",
      data: result,
    });
  }
);
const sendOtp = catchAsync(async () => {});
const verifyOtp = catchAsync(async () => {});
const assignParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tracking_number } = req.body;
    const { id } = req.params;
    const result = await ParcelService.assignParcel(
      tracking_number,
      id,
      (req.user as JwtPayload).userId
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel Assigned Successful",
      data: result,
    });
  }
);
const getAssignedParcel = catchAsync(async () => {});
const updateParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tracking_number = req.params.tracking_number;
    const result = await ParcelService.updateParcel(
      req.body,
      tracking_number,
      (req.user as JwtPayload).userId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel Updated Successfully",
      data: result,
    });
  }
);

export const ParcelController = {
  createParcel,
  getAllParcel,
  getParcelHistory,
  cancelParcel,
  updateParcelStatus,
  sendOtp,
  verifyOtp,
  assignParcel,
  getAssignedParcel,
  updateParcel,
};
