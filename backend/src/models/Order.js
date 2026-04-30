import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ""
    },
    changedByRole: {
      type: String,
      enum: ["customer", "driver", "admin", "system"],
      default: "system"
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    driverRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    deliveryAddress: {
      type: String,
      required: true,
      trim: true
    },
    litres: {
      type: Number,
      required: true,
      min: 1
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ["cod"],
      default: "cod",
      required: true
    },
    deliveryKeyHash: {
      type: String,
      default: ""
    },
    deliveryKeyForCustomer: {
      type: String,
      default: ""
    },
    deliveryKeyGeneratedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "requested", "assigned", "out_for_delivery", "completed", "cancelled"],
      default: "pending"
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
