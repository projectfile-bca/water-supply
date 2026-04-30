import express from "express";
import { login, me, registerCustomer } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register-customer", registerCustomer);
router.get("/me", requireAuth, me);

export default router;
