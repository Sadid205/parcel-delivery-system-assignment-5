import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: string;
  DB_URL: string;
  NODE_ENV: "development" | "production";
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;
  JWT: {
    JWT_ACCESS_SECRET: string;
  };
  SUPER_ADMIN: {
    SUPER_ADMIN_EMAIL: string;
    SUPER_ADMIN_PASSWORD: string;
  };
  BCRYPT: {
    BCRYPT_SALT_ROUND: string;
  };
  SMTP: {
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
  };
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    "JWT_ACCESS_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "BCRYPT_SALT_ROUND",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_PASS",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing require environment variable ${key}`);
    }
  });
  return {
    PORT: process.env.PORT as string,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    },
    SUPER_ADMIN: {
      SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
      SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    },
    BCRYPT: {
      BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    },
    SMTP: {
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_PASS: process.env.SMTP_PASS as string,
      SMTP_FROM: process.env.SMTP_FROM as string,
    },
  };
};

export const envVars = loadEnvVariables();
