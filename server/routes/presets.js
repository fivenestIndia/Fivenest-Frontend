import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import mongoose from "mongoose";
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const MAX_CLOUD_PRESETS = 3;
const PRESET_VALIDITY_DAYS = 3;
const PRESET_VALIDITY_MS = PRESET_VALIDITY_DAYS * 24 * 60 * 60 * 1000; // 3 days (72 hours)

// Helper: Filter out presets older than 3 days (auto-vanish) and enforce max 3
const cleanAndFilterPresets = (presets) => {
  if (!Array.isArray(presets)) return [];
  const now = Date.now();

  const valid = presets.filter((p) => {
    if (!p) return false;
    // Check expiresAt
    if (p.expiresAt) {
      return new Date(p.expiresAt).getTime() > now;
    }
    // Check createdAt fallback
    if (p.createdAt) {
      return now - new Date(p.createdAt).getTime() < PRESET_VALIDITY_MS;
    }
    return true;
  });

  // Stamp missing timestamps
  valid.forEach((p) => {
    if (!p.createdAt) p.createdAt = new Date().toISOString();
    if (!p.expiresAt) {
      p.expiresAt = new Date(new Date(p.createdAt).getTime() + PRESET_VALIDITY_MS).toISOString();
    }
  });

  // Enforce maximum 3 presets (keep the newest 3)
  return valid.slice(-MAX_CLOUD_PRESETS);
};

// Define DesignPreset schema in MongoDB for persistent backup
const designPresetSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true, trim: true },
    presets: { type: mongoose.Schema.Types.Mixed, required: true }, // Array of DesignPresetItem (Max 3, 3 days TTL)
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongoDesignPreset = mongoose.models.DesignPreset || mongoose.model("DesignPreset", designPresetSchema);

/**
 * @route GET /api/presets/store
 * @desc Retrieve design presets from Supabase (or MongoDB backup), filtering expired (> 3 days) and max 3
 */
router.get("/store", optionalAuth, async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  const email = req.user?.email || req.query.email;

  if (!userId && !email) {
    return res.status(400).json({ success: false, message: "Missing userId or email." });
  }

  try {
    // 1. Try Supabase via admin client
    if (supabaseAdmin && userId) {
      try {
        const { data, error } = await supabaseAdmin
          .from("plugin_usage_logs")
          .select("details, created_at")
          .eq("user_id", userId)
          .eq("plugin_type", "design_presets")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && data[0]?.details) {
          const raw = Array.isArray(data[0].details) ? data[0].details : data[0].details.presets || [];
          const validPresets = cleanAndFilterPresets(raw);
          return res.status(200).json({ success: true, source: "supabase", presets: validPresets, maxLimit: MAX_CLOUD_PRESETS, validityDays: PRESET_VALIDITY_DAYS });
        }
      } catch (sbErr) {
        console.warn("Supabase presets fetch warning:", sbErr.message);
      }
    }

    // 2. Try MongoDB backup
    if (mongoose.connection.readyState === 1) {
      try {
        const query = [];
        if (userId) query.push({ userId });
        if (email) query.push({ email: email.toLowerCase() });

        const doc = await MongoDesignPreset.findOne({ $or: query }).sort({ updatedAt: -1 });
        if (doc && doc.presets) {
          const validPresets = cleanAndFilterPresets(doc.presets);
          return res.status(200).json({ success: true, source: "mongodb", presets: validPresets, maxLimit: MAX_CLOUD_PRESETS, validityDays: PRESET_VALIDITY_DAYS });
        }
      } catch (mErr) {
        console.warn("MongoDB presets fetch skipped:", mErr.message);
      }
    }

    return res.status(200).json({ success: true, presets: [], maxLimit: MAX_CLOUD_PRESETS, validityDays: PRESET_VALIDITY_DAYS });
  } catch (err) {
    console.error("Error fetching presets store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/presets/store
 * @desc Save design presets (Max 3 on cloud, auto-expire after 3 days)
 */
router.post("/store", optionalAuth, async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const email = req.user?.email || req.body.email;
  const rawPresets = req.body.presets;

  if (!rawPresets || !Array.isArray(rawPresets)) {
    return res.status(400).json({ success: false, message: "Missing or invalid presets array." });
  }

  if (!userId && !email) {
    return res.status(400).json({ success: false, message: "Missing userId or email." });
  }

  // Filter expired (> 3 days) and enforce max 3 cloud presets
  const presets = cleanAndFilterPresets(rawPresets);

  try {
    let supabaseSuccess = false;

    // 1. Save to Supabase using Admin client
    if (supabaseAdmin && userId) {
      try {
        const { error } = await supabaseAdmin.from("plugin_usage_logs").insert({
          user_id: userId,
          plugin_type: "design_presets",
          action: "save_design_presets",
          details: { presets, updatedAt: new Date().toISOString(), validityDays: PRESET_VALIDITY_DAYS, maxLimit: MAX_CLOUD_PRESETS },
        });
        if (!error) supabaseSuccess = true;
      } catch (sbErr) {
        console.warn("Supabase admin presets save warning:", sbErr.message);
      }
    }

    // 2. Save / Upsert to MongoDB
    if (mongoose.connection.readyState === 1 && (userId || email)) {
      try {
        const filter = [];
        if (userId) filter.push({ userId });
        if (email) filter.push({ email: email.toLowerCase() });

        await MongoDesignPreset.findOneAndUpdate(
          { $or: filter },
          {
            userId: userId || undefined,
            email: email ? email.toLowerCase() : undefined,
            presets,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (mErr) {
        console.warn("MongoDB presets save skipped:", mErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      supabaseSaved: supabaseSuccess,
      presets,
      maxLimit: MAX_CLOUD_PRESETS,
      validityDays: PRESET_VALIDITY_DAYS,
      message: `Design presets successfully synced (Max ${MAX_CLOUD_PRESETS}, 3-day validity).`,
    });
  } catch (err) {
    console.error("Error saving presets store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
