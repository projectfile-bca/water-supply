import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, "driver-documents");

    res.status(201).json({
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    next(error);
  }
}
