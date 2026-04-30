import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import dns from "dns";

// Force Google DNS (fixes SRV issue)
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
const app = express();
const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("🚀 Water Supply API is running...");
});
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/drivers", driverRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);

app.use((error, _req, res, _next) => {
  const status = error.message?.includes("Only jpg") ? 400 : 500;
  res.status(status).json({
    message: error.message || "Server error"
  });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
