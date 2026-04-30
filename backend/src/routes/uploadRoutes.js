import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { imageUpload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", imageUpload.single("image"), uploadImage);

export default router;
