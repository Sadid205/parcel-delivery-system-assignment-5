import express from "express";
import expressSession from "express-session";
import { envVars } from "./app/config/env";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
// app.use(pasport.initialize())
// app.use(pasport.session())
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
