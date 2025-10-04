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
exports.AuthServices = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const AppErrors_1 = __importDefault(require("../../errorHelpers/AppErrors"));
const sendEmail_1 = require("../../utils/sendEmail");
const userTokens_1 = require("../../utils/userTokens");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const newAccessToken = yield (0, userTokens_1.createNewAccessTokenWithRefreshToken)(refreshToken);
    return {
        accessToken: newAccessToken,
    };
});
const changePassword = (oldPassword, newPassword, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(decodedToken.userId);
    const isOldPasswordMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "Old Password Does Not Match");
    }
    user.password = yield bcryptjs_1.default.hash(newPassword, Number(env_1.envVars.BCRYPT.BCRYPT_SALT_ROUND));
    user.save();
});
const setPassword = (userId, plainPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppErrors_1.default(404, "User Not Found");
    }
    if (user.password &&
        user.auths.some((providerObject) => providerObject.provider === "credentials")) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, "You Have Already Set Your Passwrod. Now You Can Change The Password From You Profile Password Update");
    }
    if (user.auths.some((providerObject) => providerObject.provider === "google")) {
        const hashedPassword = yield bcryptjs_1.default.hash(plainPassword, Number(env_1.envVars.BCRYPT.BCRYPT_SALT_ROUND));
        const credentialsProvider = {
            provider: "credentials",
            providerId: user.email,
        };
        const auths = [...user.auths, credentialsProvider];
        user.auths = auths;
        yield user.save();
    }
    return {};
});
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (!isUserExist) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, "User Does Not Exist");
    }
    if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED ||
        isUserExist.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `User Is ${isUserExist.isActive}`);
    }
    if (isUserExist.isDeleted) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `User Is Deleted`);
    }
    if (!isUserExist.isVerified) {
        throw new AppErrors_1.default(http_status_codes_1.default.BAD_REQUEST, `User Is Not Verified`);
    }
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
    };
    const resetToken = jsonwebtoken_1.default.sign(jwtPayload, env_1.envVars.JWT.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
    const resetUILink = `${env_1.envVars.FRONTEND_URL}/public/reset-password?id=${isUserExist._id}&token=${resetToken}`;
    (0, sendEmail_1.sendEmail)({
        to: isUserExist.email,
        subject: "Password Reset",
        templateName: "forgotPassword",
        templateData: {
            name: isUserExist.name,
            resetUILink,
        },
    });
});
const resetPassword = (paylaod, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (paylaod.id != decodedToken.userId) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Can Not Reset Your Password");
    }
    const isUserExist = yield user_model_1.User.findById(paylaod.id);
    if (!isUserExist) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "User Does Not Exist");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(paylaod.password, Number(env_1.envVars.BCRYPT.BCRYPT_SALT_ROUND));
    isUserExist.password = hashedPassword;
    yield isUserExist.save();
    return {};
});
exports.AuthServices = {
    getNewAccessToken,
    changePassword,
    setPassword,
    forgotPassword,
    resetPassword,
};
