import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import AppError from "../../errorHelpers/AppErrors";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { AuthServices } from "./auth.service";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(new AppError(401, err));
      }
      if (!user) {
        return next(new AppError(401, info.message));
      }
      const userTokens = createUserTokens(user);

      const { password: pass, ...rest } = user.toObject();
      setAuthCookie(res, userTokens);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "New Access Token Retrieve Successfully",
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
          user: rest,
        },
      });
    })(req, res, next);
  }
);
const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No Refresh Token Received From Cookies"
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );
    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged In Successfully",
      data: tokenInfo,
    });
  }
);
const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  }
);
const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const { password } = req.body;
    console.log({ decodedToken, body: req.body });
    await AuthServices.setPassword(decodedToken.userId, password);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  }
);
const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    await AuthServices.forgotPassword(email);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email Sent Successfully",
      data: null,
    });
  }
);
const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const { id } = req.headers;
    const payload = {
      ...req.body,
      id,
    };
    await AuthServices.resetPassword(payload, decodedToken);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged Out Successfully",
      data: null,
    });
  }
);

/**
[1] ইউজার login form submit করে => POST /api/login
        ⬇
[2] credentialsLogin(req, res, next) function কল হয়
        ⬇
[3] passport.authenticate("local", callback)(req, res, next) কল হয়
        ⬇
[4] passport "local" strategy detect করে
        ⬇
[5] LocalStrategy(...) এর async function(email, password, done) কল হয়
        ⬇
[6] তোমার ডাটাবেজে check হয়: ইউজার আছে কিনা, password ঠিক কিনা
        ⬇
[7] done(null, user) বা done(null, false, { message }) কল হয়
        ⬇
[8] passport.authenticate(...) এর callback কল হয়: (err, user, info)
        ⬇
[9] তুমি JWT তৈরি করো, cookie সেট করো, response পাঠাও
 */

/**
(req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    ...
  })(req, res, next)
}
↓
passport.authenticate("local")  => internalMiddleware(req, res, next)
↓
Calls LocalStrategy.authenticate(req)
↓
Calls your verify(email, password, done)
↓
done(null, user) => Goes back to your (err, user, info) => {...}

 */

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
  logout,
};
