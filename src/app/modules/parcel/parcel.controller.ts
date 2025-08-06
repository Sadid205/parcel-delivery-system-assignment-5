import { catchAsync } from "../../utils/catchAsync";

const createParcel = catchAsync(async () => {});
const getAllParcel = catchAsync(async () => {});
const getParcelHistory = catchAsync(async () => {});
const cancelParcel = catchAsync(async () => {});
const updateParcelStatus = catchAsync(async () => {});
const sendOtp = catchAsync(async () => {});
const verifyOtp = catchAsync(async () => {});

export const ParcelController = {
  createParcel,
  getAllParcel,
  getParcelHistory,
  cancelParcel,
  updateParcelStatus,
  sendOtp,
  verifyOtp,
};
