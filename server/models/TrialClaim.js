import mongoose from "mongoose";

const trialClaimSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      trim: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    gstin: {
      type: String,
      trim: true
    },
    stage: {
      type: String,
      enum: [
        'pending_review',
        'clarification_requested',
        'approved_stage1',
        'active_full_trial',
        'rejected',
        'expired'
      ],
      default: 'pending_review',
      index: true
    },
    creditGranted: {
      type: Number,
      default: 0
    },
    creditUsed: {
      type: Number,
      default: 0
    },
    promoBalance: {
      type: Number,
      default: 0
    },
    activatedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    ordersPortalTrial: {
      type: Boolean,
      default: true
    },
    clarificationMessage: {
      type: String,
      default: ""
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    onboardingNotes: {
      type: String,
      default: ""
    },
    decisionHistory: [
      {
        adminEmail: String,
        action: String,
        amount: Number,
        note: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    deviceFingerprint: {
      type: String
    },
    flags: {
      phoneMatch: { type: Boolean, default: false },
      businessMatch: { type: Boolean, default: false },
      ipMatch: { type: Boolean, default: false },
      matchedRecords: [String]
    }
  },
  { timestamps: true }
);

// Normalize mobile number helper for duplicate detection (e.g. removes +91, 0, spaces, dashes)
trialClaimSchema.statics.normalizePhone = function(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  // If 12 digits starting with 91, strip 91
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  // If 11 digits starting with 0, strip 0
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
};

export default mongoose.models.TrialClaim || mongoose.model("TrialClaim", trialClaimSchema);
