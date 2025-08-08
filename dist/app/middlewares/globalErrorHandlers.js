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
exports.globalErrorhandler = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const env_1 = require("../config/env");
const handleDuplicateKeyError_1 = require("../helpers/handleDuplicateKeyError");
const handleCastError_1 = require("../helpers/handleCastError");
const handleZodError_1 = require("../helpers/handleZodError");
const handleValidationError_1 = require("../helpers/handleValidationError");
const AppErrors_1 = __importDefault(require("../errorHelpers/AppErrors"));
const globalErrorhandler = (err, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let errorSources = [];
    let statusCode = 500;
    let message = `Something Went Wrong!!`;
    // duplicate key error
    if (err.code === 11000) {
        const simplyfiedError = (0, handleDuplicateKeyError_1.handleDuplicateKeyError)(err);
        statusCode = simplyfiedError.statusCode;
        message = simplyfiedError.message;
        errorSources = simplyfiedError.errorSources;
    }
    else if (err.name === "CastError") {
        const simplyfiedError = (0, handleCastError_1.handleCastError)(err);
        statusCode = simplyfiedError.statusCode;
        message = simplyfiedError.message;
        errorSources = simplyfiedError.errorSources;
    }
    else if (err.name === "ZodError") {
        const simplyfiedError = (0, handleZodError_1.handleZodError)(err);
        statusCode = simplyfiedError.statusCode;
        message = simplyfiedError.message;
        errorSources = simplyfiedError.errorSources;
    }
    else if (err.name === "ValidationError") {
        const simplyfiedError = (0, handleValidationError_1.handleValidationError)(err);
        statusCode = simplyfiedError.statusCode;
        message = simplyfiedError.message;
        errorSources = simplyfiedError.errorSources;
    }
    else if (err instanceof AppErrors_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    res.status(http_status_codes_1.default.BAD_REQUEST).json({
        success: false,
        message: message,
        errorSources,
        err: env_1.envVars.NODE_ENV === "development" ? err : null,
        stack: env_1.envVars.NODE_ENV === "development" ? err.stack : null,
    });
});
exports.globalErrorhandler = globalErrorhandler;
