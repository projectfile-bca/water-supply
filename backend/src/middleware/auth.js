import jwt from "jsonwebtoken";
import AdminCredential from "../models/AdminCredential.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role === "admin" && payload.adminId) {
      const admin = await AdminCredential.findById(payload.adminId).select("-passwordHash");
      if (!admin) {
        return res.status(401).json({ message: "Invalid authentication token." });
      }

      req.user = {
        _id: admin._id,
        name: admin.username,
        username: admin.username,
        role: "admin",
        isApproved: true,
        isAvailable: true
      };
      next();
      return;
    }

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid authentication token." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
}

export function requireApprovedDriver(req, res, next) {
  if (req.user?.role === "driver" && !req.user.isApproved) {
    return res.status(403).json({ message: "Driver account is pending admin approval." });
  }

  next();
}
