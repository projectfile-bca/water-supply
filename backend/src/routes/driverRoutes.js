import express from "express";
import { applyDriver, updateDriverAvailability } from "../controllers/driverController.js";
import { requireApprovedDriver, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/apply", applyDriver);
router.patch("/availability", requireAuth, requireApprovedDriver, updateDriverAvailability);

export default router;
