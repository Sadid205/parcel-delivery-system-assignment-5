import express, { Request, Response } from "express";
import expressSession from "express-session";
import { envVars } from "./app/config/env";
import cookieParser from "cookie-parser";
import cors from "cors";
import { router } from "./app/routes";
import httpStatus from "http-status-codes";
import passport from "passport";
import "./app/config/passport.config";
import { globalErrorhandler } from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";
const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "Welcome to Parcel Delevery Management System Backend",
  });
});

app.use(globalErrorhandler);

app.use(notFound);

export default app;
