"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const parcel_route_1 = require("../modules/parcel/parcel.route");
const otp_route_1 = require("../modules/otp/otp.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.AuthRoute,
    },
    {
        path: "/user",
        route: user_route_1.UserRoute,
    },
    {
        path: "/parcel",
        route: parcel_route_1.ParcelRoute,
    },
    {
        path: "/otp",
        route: otp_route_1.OtpRoutes,
    },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
