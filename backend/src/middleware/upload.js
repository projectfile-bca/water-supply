import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only jpg, jpeg, and png image files are allowed."));
      return;
    }

    cb(null, true);
  }
});
