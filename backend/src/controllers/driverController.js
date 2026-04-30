import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function applyDriver(req, res, next) {
  try {
    const { name, phone, email, password, aadhaarUrl, licenseUrl } = req.body;

    if (!name || !phone || !email || !password || !aadhaarUrl || !licenseUrl) {
      return res.status(400).json({
        message: "Name, phone, email, password, Aadhaar image URL, and license image URL are required."
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const driver = await User.create({
      name,
      phone,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "driver",
      documents: {
        aadhaarUrl,
        licenseUrl
      },
      isApproved: false,
      isAvailable: true
    });

    res.status(201).json({
      message: "Driver application submitted. Awaiting admin approval.",
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        documents: driver.documents,
        isApproved: driver.isApproved
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingDrivers(_req, res, next) {
  try {
    const drivers = await User.find({ role: "driver", isApproved: false })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ drivers });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedDrivers(_req, res, next) {
  try {
    const drivers = await User.find({ role: "driver", isApproved: true })
      .select("-passwordHash")
      .sort({ name: 1 });

    res.json({ drivers });
  } catch (error) {
    next(error);
  }
}

export async function approveDriver(req, res, next) {
  try {
    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: "driver" },
      { isApproved: true },
      { new: true }
    ).select("-passwordHash");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    res.json({ message: "Driver approved.", driver });
  } catch (error) {
    next(error);
  }
}

export async function updateDriverAvailability(req, res, next) {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can update availability." });
    }

    const driver = await User.findByIdAndUpdate(
      req.user._id,
      { isAvailable: Boolean(req.body.isAvailable) },
      { new: true }
    ).select("-passwordHash");

    res.json({
      message: "Availability updated.",
      driver
    });
  } catch (error) {
    next(error);
  }
}
