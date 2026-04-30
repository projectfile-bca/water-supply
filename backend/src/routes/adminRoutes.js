import express from "express";
import { getAdminProfile, updateAdminProfile } from "../controllers/adminController.js";
import { approveDriver, getApprovedDrivers, getPendingDrivers } from "../controllers/driverController.js";
import {
  approveOrderDriverRequest,
  generateOrderDeliveryKey,
  getAllOrders
} from "../controllers/orderController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", requireAuth, requireAdmin, getAdminProfile);
router.patch("/profile", requireAuth, requireAdmin, updateAdminProfile);
router.get("/drivers/pending", requireAuth, requireAdmin, getPendingDrivers);
router.get("/drivers/approved", requireAuth, requireAdmin, getApprovedDrivers);
router.patch("/drivers/:id/approve", requireAuth, requireAdmin, approveDriver);
router.get("/orders", requireAuth, requireAdmin, getAllOrders);
router.patch("/orders/:id/approve-request", requireAuth, requireAdmin, approveOrderDriverRequest);
router.patch("/orders/:id/generate-delivery-key", requireAuth, requireAdmin, generateOrderDeliveryKey);

export default router;
