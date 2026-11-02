import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import mongoose from "mongoose";
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Define DesignPreset schema in MongoDB for persistent backup
const designPresetSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true, trim: true },
    presets: { type: mongoose.Schema.Types.Mixed, required: true }, // Array of DesignPresetItem
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongoDesignPreset = mongoose.models.DesignPreset || mongoose.model("DesignPreset", designPresetSchema);

/**
 * @route GET /api/presets/store
 * @desc Retrieve design presets from Supabase (or MongoDB backup)
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
          const presets = Array.isArray(data[0].details) ? data[0].details : data[0].details.presets || [];
          return res.status(200).json({ success: true, source: "supabase", presets });
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
          return res.status(200).json({ success: true, source: "mongodb", presets: doc.presets });
        }
      } catch (mErr) {
        console.warn("MongoDB presets fetch skipped:", mErr.message);
      }
    }

    return res.status(200).json({ success: true, presets: [] });
  } catch (err) {
    console.error("Error fetching presets store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/presets/store
 * @desc Save or update design presets into Supabase and MongoDB
 */
router.post("/store", optionalAuth, async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const email = req.user?.email || req.body.email;
  const presets = req.body.presets;

  if (!presets || !Array.isArray(presets)) {
    return res.status(400).json({ success: false, message: "Missing or invalid presets array." });
  }

  if (!userId && !email) {
    return res.status(400).json({ success: false, message: "Missing userId or email." });
  }

  try {
    let supabaseSuccess = false;

    // 1. Save to Supabase using Admin client
    if (supabaseAdmin && userId) {
      try {
        const { error } = await supabaseAdmin.from("plugin_usage_logs").insert({
          user_id: userId,
          plugin_type: "design_presets",
          action: "save_design_presets",
          details: { presets, updatedAt: new Date().toISOString() },
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
      message: "Design presets successfully synced to cloud.",
    });
  } catch (err) {
    console.error("Error saving presets store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
