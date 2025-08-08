import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { ParcelController } from "./parcel.controller";
import { validatedRequest } from "../../middlewares/validatedRequest";
import {
  assignParcelSchema,
  createParcelZodSchema,
  sendOtpSchema,
  updateParcelStatusSchema,
  verifyOtpSchema,
} from "./parcel.validation";

const router = Router();

router.post(
  "/",
  checkAuth(...Object.values(Role)),
  validatedRequest(createParcelZodSchema),
  ParcelController.createParcel
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.getAllParcel
);
router.get(
  "/history",
  checkAuth(...Object.values(Role)),
  ParcelController.getParcelHistory
);
router.patch(
  "/cancel/:tracking_number",
  checkAuth(...Object.values(Role)),
  ParcelController.cancelParcel
);
router.patch(
  "/update-status/:tracking_number",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(updateParcelStatusSchema),
  ParcelController.updateParcelStatus
);
router.patch(
  "/:tracking_number",
  checkAuth(...Object.values(Role)),
  ParcelController.updateParcel
);
router.post(
  "/assign/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(assignParcelSchema),
  ParcelController.assignParcel
);
router.get(
  "/assigned-parcel",
  checkAuth(Role.DELIVERY_MAN),
  ParcelController.getAssignedParcel
);
router.post(
  "/send-otp",
  checkAuth(Role.DELIVERY_MAN),
  validatedRequest(sendOtpSchema),
  ParcelController.sendOtp
);
router.post(
  "/verify-otp",
  checkAuth(Role.DELIVERY_MAN),
  validatedRequest(verifyOtpSchema),
  ParcelController.verifyOtp
);

export const ParcelRoute = router;
