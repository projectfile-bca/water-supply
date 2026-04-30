import bcrypt from "bcryptjs";
import AdminCredential from "../models/AdminCredential.js";

export async function getAdminProfile(req, res) {
  res.json({
    admin: {
      id: req.user._id,
      username: req.user.username,
      role: "admin"
    }
  });
}

export async function updateAdminProfile(req, res, next) {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username && !newPassword) {
      return res.status(400).json({ message: "Username or new password is required." });
    }

    const admin = await AdminCredential.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found." });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      admin.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (username) {
      admin.username = username;
    }

    await admin.save();

    res.json({
      message: "Admin account updated.",
      admin: {
        id: admin._id,
        username: admin.username,
        role: "admin"
      }
    });
  } catch (error) {
    next(error);
  }
}
