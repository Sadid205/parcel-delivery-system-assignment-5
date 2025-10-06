# 📦 Parcel Delivery System API

A backend API for managing users, authentication, and parcel delivery operations.  
Built with **TypeScript**, **Express.js**, **MongoDB**, and **JWT Authentication**.

---

## 🚀 Project Overview

This project is a **Parcel Delivery Management System** where users can register, send parcels, track delivery status, manage accounts, and more.  
It includes full **authentication flow** (register, login, logout, password reset, OTP verification) and parcel management features (create, update, cancel, assign, verify delivery).

---

## 🛠️ Tech Stack

- **Node.js** + **Express.js** (Server)
- **TypeScript** (Language)
- **MongoDB** + Mongoose (Database)
- **JWT** Authentication
- **Zod** (Validation)
- **ESLint** (Linting)
- **Vercel** (Deployment)

---

## ⚙️ Setup & Environment Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sadid205/parcel-delivery-system-assignment-5.git

```

2️⃣ Install Dependencies
npm install

3️⃣ Setup Environment Variables
Create a .env file in the root directory and configure:

EXPRESS_SESSION_SECRET="EXPRESS_SESSION_SECRET"

FRONTEND_URL="FRONTEND_URL"

# JWT

JWT_ACCESS_SECRET="JWT_ACCESS_SECRET"
JWT_ACCESS_EXPIRES="JWT_ACCESS_EXPIRES"
JWT_REFRESH_SECRET="JWT_REFRESH_SECRET"
JWT_REFRESH_EXPIRES="JWT_REFRESH_EXPIRES"

# SUPER ADMIN CREDENTIALS

SUPER_ADMIN_EMAIL="SUPER_ADMIN_EMAIL"
SUPER_ADMIN_PASSWORD="SUPER_ADMIN_PASSWORD"

# BCRYPT

BCRYPT_SALT_ROUND="BCRYPT_SALT_ROUND"

# SMTP GMAIL

SMTP_HOST="SMTP_HOST"
SMTP_PORT="SMTP_PORT"
SMTP_USER="SMTP_USER"
SMTP_PASS="SMTP_PASS"
SMTP_FROM="SMTP_FROM"

NODE_ENV="NODE_ENV"

PORT="PORT"

# DB

DB_URL="DB_URL"

# REDIS

REDIS_HOST="REDIS_HOST"
REDIS_PORT="REDIS_PORT"
REDIS_USERNAME="REDIS_USERNAME"
REDIS_PASSWORD="REDIS_PASSWORD"

4️⃣ Run in Development
bash
Copy
Edit
npm run dev

5️⃣ Build & Run in Production
bash
Copy
Edit
npm run build
npm start

6️⃣ Lint the Code
bash
Copy
Edit
npm run lint

📌 API Endpoints
User Management
| # | Method | Endpoint | Description | Body |
| - | ------ | ------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| 1 | POST | `/api/v1/user/register` | Register a new user | `{ "name":"Md.Asad", "email":"wingsofabir444@gmail.com", "password":"112233@U" }` |
| 2 | GET | `/api/v1/user/all-users` | Get all users | - |
| 3 | GET | `/api/v1/user/me` | Get current user profile | - |
| 4 | GET | `/api/v1/user/:id` | Get user by ID | - |
| 5 | PATCH | `/api/v1/user/:id` | Update user by ID | `{ ...fieldsToUpdate }` |

Authentication
| # | Method | Endpoint | Description | Body |
| -- | ------ | ------------------------------ | ---------------------- | ------------------------------------------------------------------- |
| 6 | POST | `/api/v1/auth/login` | Login | `{ "email":"abdullahalsadid1914@gmail.com", "password":"1234567" }` |
| 7 | POST | `/api/v1/auth/logout` | Logout | - |
| 8 | POST | `/api/v1/auth/refresh-token` | Refresh access token | - |
| 9 | POST | `/api/v1/auth/change-password` | Change password | `{ "oldPassword":"", "newPassword":"" }` |
| 10 | POST | `/api/v1/auth/set-password` | Set password | `{ "password":"" }` |
| 11 | POST | `/api/v1/auth/forgot-password` | Request password reset | `{ "email":"" }` |
| 12 | POST | `/api/v1/auth/reset-password` | Reset password | `{ "password":"" }` |

Parcel Management
| # | Method | Endpoint | Description | Body |
| -- | ------ | ----------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13 | POST | `/api/v1/parcel` | Create a new parcel | `{ "receiver":{ "name":"Sadid", "email":"wingsofabird444@gmail.com", "phone":"01881543084", "address":"Harinakunda,Jhenaidah" }, "weight":40, "parcel_type":"ELECTRONICS" }` |
| 14 | GET | `/api/v1/parcel` | Get all parcels | - |
| 15 | GET | `/api/v1/parcel/history` | Get parcel history | - |
| 16 | GET | `/api/v1/parcel/cancel/:tracking_number` | Cancel a parcel | - |
| 17 | PATCH | `/api/v1/parcel/update-status/:tracking_number` | Update parcel status | `{ "fees":50, "delivery_date":"2025-08-09", "paid_status":"PAID" }` |
| 18 | PATCH | `/api/v1/parcel/:tracking_number` | Update parcel details | `{ "receiver":{ "name":"Shahadat" }, "weight":50, "parcel_type":"BOX" }` |
| 19 | POST | `/api/v1/parcel/assign/:userId` | Assign parcel to delivery man | `{ "tracking_number":"TRK-1754654141237-433" }` |
| 20 | POST | `/api/v1/parcel/send-otp` | Send OTP for parcel | `{ "tracking_number":"TRK-1754569821228-250" }` |
| 21 | GET | `/api/v1/parcel/assigned-parcel` | Get assigned parcels | - |
| 22 | POST | `/api/v1/parcel/verify-otp` | Verify OTP | `{ "tracking_number":"TRK-1754654141237-433", "otp":"392425" }` |
| 23 | GET | `/api/v1/parcel/:tracking_number` | Get parcel by tracking number | - |

📜 Scripts

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm start`     | Run compiled server              |
| `npm run dev`   | Run server in development mode   |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run lint`  | Lint code with ESLint            |

📌 Deployment
This project is deployed on Vercel:
Base URL: https://parcel-delivery-system-beta.vercel.app

📧 Contact
For any issues or contributions, please contact abdullahalsadid@gmail.com
