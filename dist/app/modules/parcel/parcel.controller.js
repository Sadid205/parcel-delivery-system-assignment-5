"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const parcel_service_1 = require("./parcel.service");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const newParcel = yield parcel_service_1.ParcelService.createParcel(req.body, req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Parcel Has Been Successfully Created And Is Now Being Processed.",
        data: newParcel,
    });
}));
const getAllParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield parcel_service_1.ParcelService.getAllParcel(query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "All Parcel Retrieved Successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getParcelHistory = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield parcel_service_1.ParcelService.getParcelHistory(req.user.userId, query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Your Parcel History Retrieved Successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const cancelParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tracking_number = req.params.tracking_number;
    const result = yield parcel_service_1.ParcelService.cancelParcel(tracking_number, req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Cancelled Successful",
        data: result,
    });
}));
const updateParcelStatus = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tracking_number = req.params.tracking_number;
    const result = yield parcel_service_1.ParcelService.updateParcelStatus(tracking_number, req.body);
    // console.log(req.body.delivery_date);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Status Updated Successful",
        data: result,
    });
}));
const assignParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { tracking_number } = req.body;
    const { id } = req.params;
    console.log(tracking_number);
    const result = yield parcel_service_1.ParcelService.assignParcel(tracking_number, id, req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Assigned Successful",
        data: result,
    });
}));
const updateParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tracking_number = req.params.tracking_number;
    const result = yield parcel_service_1.ParcelService.updateParcel(req.body, tracking_number, req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Updated Successfully",
        data: result,
    });
}));
const getAssignedParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield parcel_service_1.ParcelService.getAssignedParcel(req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Your Assigned Parcel Retrieve Successfully",
        data: result,
    });
}));
const sendOtp = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { tracking_number } = req.body;
    console.log(tracking_number);
    const result = yield parcel_service_1.ParcelService.sendOtp(tracking_number);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "OTP Sent Successfully",
        data: result,
    });
}));
const verifyOtp = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp, tracking_number } = req.body;
    const result = yield parcel_service_1.ParcelService.verifyOtp(otp, tracking_number, req.user.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Delivered Successful",
        data: result,
    });
}));
const getSingleParcel = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { tracking_number } = req.params;
    const result = yield parcel_service_1.ParcelService.getSingleParcel(tracking_number);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel Retrieved Successfully",
        data: result,
    });
}));
exports.ParcelController = {
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
    getSingleParcel,
};
