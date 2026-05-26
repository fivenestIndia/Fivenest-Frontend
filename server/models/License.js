import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ["starter", "pro", "premium", "enterprise"],
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "suspended"],
      default: "active",
    },
    activatedDevices: {
      type: [String],
      default: [],
    },
    maxDevices: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const License = mongoose.model("License", licenseSchema);
export default License;
