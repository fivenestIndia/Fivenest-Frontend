import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    // Existing schema fields (optional for compatibility)
    licenseKey: {
      type: String,
      index: true,
    },
    planId: {
      type: String,
      enum: ["starter", "pro", "premium", "enterprise"],
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    activatedDevices: {
      type: [String],
      default: [],
    },
    maxDevices: {
      type: Number,
      default: 1,
    },

    // Alternate schema fields (from user's database)
    key: {
      type: String,
      index: true,
    },
    planType: {
      type: String,
      enum: ["starter", "pro", "premium", "enterprise"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hwid: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
    },
    os: {
      type: String,
    },

    // Shared required fields
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
  },
  {
    timestamps: true,
  }
);

const License = mongoose.model("License", licenseSchema);
export default License;
