import mongoose from "mongoose";

const adminCredentialSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("AdminCredential", adminCredentialSchema);
