import express from "express";
import {
  cancelMyOrder,
  confirmOrderDelivery,
  createOrder,
  getDriverVisibleOrders,
  getMyOrders,
  requestOrderAsDriver,
  updateDriverOrderStatus
} from "../controllers/orderController.js";
import { requireApprovedDriver, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, requireApprovedDriver, createOrder);
router.get("/mine", requireAuth, requireApprovedDriver, getMyOrders);
router.get("/driver", requireAuth, requireApprovedDriver, getDriverVisibleOrders);
router.post("/:id/request", requireAuth, requireApprovedDriver, requestOrderAsDriver);
router.patch("/:id/driver-status", requireAuth, requireApprovedDriver, updateDriverOrderStatus);
router.patch("/:id/confirm-delivery", requireAuth, requireApprovedDriver, confirmOrderDelivery);
router.patch("/:id/cancel", requireAuth, requireApprovedDriver, cancelMyOrder);

export default router;
