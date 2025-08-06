import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { ParcelController } from "./parcel.controller";

const router = Router();

router.post(
  "/",
  checkAuth(...Object.values(Role)),
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
  "/cancel/:id",
  checkAuth(...Object.values(Role)),
  ParcelController.cancelParcel
);
router.patch(
  "/update-status/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.updateParcelStatus
);
router.post(
  "/send-otp",
  checkAuth(Role.DELIVERY_MAN),
  ParcelController.sendOtp
);
router.post(
  "/verify-otp",
  checkAuth(Role.DELIVERY_MAN),
  ParcelController.verifyOtp
);

export const ParcelRoute = router;
