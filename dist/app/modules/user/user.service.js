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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const env_1 = require("../../config/env");
const user_interface_1 = require("./user.interface");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("./user.model");
const queryBuilder_1 = require("../../utils/queryBuilder");
const user_constant_1 = require("./user.constant");
const AppErrors_1 = __importDefault(require("../../errorHelpers/AppErrors"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload, rest = __rest(payload, ["email", "password"]);
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT.BCRYPT_SALT_ROUND));
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const user = yield user_model_1.User.create(Object.assign({ email, password: hashedPassword, auths: [authProvider] }, rest));
    return user;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new queryBuilder_1.QueryBuilder(user_model_1.User.find(), query);
    const users = queryBuilder
        .search(user_constant_1.userSearchableFields)
        .filter()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        users.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select("-password");
    return {
        data: user,
    };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user,
    };
});
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (![user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN].includes(decodedToken.role)) {
        if (decodedToken.userId != userId) {
            throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You are not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppErrors_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN &&
        isUserExist.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Are Not Authorized");
    }
    if (payload.role &&
        [user_interface_1.Role.USER, user_interface_1.Role.DELIVERY_MAN].includes(decodedToken.role)) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Are Not Authorized");
    }
    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if ([user_interface_1.Role.USER, user_interface_1.Role.DELIVERY_MAN].includes(decodedToken.role)) {
            throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Are Not Authorized");
        }
    }
    if (payload.password) {
        throw new AppErrors_1.default(http_status_codes_1.default.UNAUTHORIZED, "You Are Not Authorized");
    }
    const newUpdatedUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    });
    return newUpdatedUser;
});
exports.UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    getMe,
    updateUser,
};
