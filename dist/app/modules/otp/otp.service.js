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
exports.OTPService = exports.generateOTP = exports.OTP_EXPIRATION = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../user/user.model");
const AppErrors_1 = __importDefault(require("../../errorHelpers/AppErrors"));
const redis_config_1 = require("../../config/redis.config");
const sendEmail_1 = require("../../utils/sendEmail");
exports.OTP_EXPIRATION = 3 * 60; // 3 minutes
const generateOTP = (length = 6) => {
    // 6 digit
    const otp = crypto_1.default.randomInt(10 ** (length - 1), 10 ** length);
    return otp;
};
exports.generateOTP = generateOTP;
const sendOtp = (email, name) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email: email });
    if (!user) {
        throw new AppErrors_1.default(400, "User Not Found");
    }
    if (user.isVerified) {
        throw new AppErrors_1.default(400, "User Already Verified");
    }
    const otp = (0, exports.generateOTP)();
    const redisKey = `otp:${email}`;
    yield redis_config_1.redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX",
            value: exports.OTP_EXPIRATION,
        },
    });
    yield (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "Your OTP Code",
        templateName: "otp",
        templateData: {
            name: name,
            otp: otp,
        },
    });
    return {};
});
const verifyOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email: email });
    if (!user) {
        throw new AppErrors_1.default(400, "User Not Found");
    }
    if (user.isVerified) {
        throw new AppErrors_1.default(400, "User Already Verified");
    }
    const redisKey = `otp:${email}`;
    const savedOtp = yield redis_config_1.redisClient.get(redisKey);
    if (!savedOtp) {
        throw new AppErrors_1.default(400, "Invalid OTP");
    }
    if (savedOtp !== otp) {
        throw new AppErrors_1.default(400, "Invalid OTP");
    }
    yield Promise.all([
        user_model_1.User.updateOne({ email: email }, { isVerified: true }, { runValidators: true }),
        redis_config_1.redisClient.del([redisKey]),
    ]);
    return {};
});
exports.OTPService = {
    sendOtp,
    verifyOtp,
};
