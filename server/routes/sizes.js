import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import mongoose from "mongoose";

const router = express.Router();

// Define SizeEditor schema in MongoDB for backup
const sizeEditorSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true, trim: true },
    sizesData: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongoSizeEditor = mongoose.models.SizeEditor || mongoose.model("SizeEditor", sizeEditorSchema);

/**
 * @route GET /api/sizes/store
 * @desc Retrieve size editor data from Supabase (or MongoDB backup)
 */
router.get("/store", async (req, res) => {
  const { userId, email } = req.query;

  if (!userId && !email) {
    return res.status(400).json({ success: false, message: "Missing userId or email." });
  }

  try {
    // 1. Try Supabase via admin client
    if (supabaseAdmin && userId) {
      const { data, error } = await supabaseAdmin
        .from("plugin_usage_logs")
        .select("details, created_at")
        .eq("user_id", userId)
        .eq("plugin_type", "size_editor_data")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.details) {
        return res.status(200).json({ success: true, source: "supabase", sizesData: data[0].details });
      }
    }

    // 2. Try MongoDB backup
    const query = [];
    if (userId) query.push({ userId });
    if (email) query.push({ email: email.toLowerCase() });

    const doc = await MongoSizeEditor.findOne({ $or: query }).sort({ updatedAt: -1 });
    if (doc && doc.sizesData) {
      return res.status(200).json({ success: true, source: "mongodb", sizesData: doc.sizesData });
    }

    return res.status(200).json({ success: true, sizesData: null });
  } catch (err) {
    console.error("Error fetching size editor store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/sizes/store
 * @desc Save size editor data into Supabase and MongoDB
 */
router.post("/store", async (req, res) => {
  const { userId, email, sizesData } = req.body;

  if (!sizesData) {
    return res.status(400).json({ success: false, message: "Missing sizesData." });
  }

  try {
    let supabaseSuccess = false;

    // 1. Save to Supabase using Admin client
    if (supabaseAdmin && userId) {
      try {
        const { error } = await supabaseAdmin.from("plugin_usage_logs").insert({
          user_id: userId,
          plugin_type: "size_editor_data",
          action: "save_factory_sizes",
          details: sizesData,
        });
        if (!error) supabaseSuccess = true;
      } catch (sbErr) {
        console.warn("Supabase admin sizes save warning:", sbErr);
      }
    }

    // 2. Save / Upsert to MongoDB
    if (userId || email) {
      const filter = [];
      if (userId) filter.push({ userId });
      if (email) filter.push({ email: email.toLowerCase() });

      await MongoSizeEditor.findOneAndUpdate(
        { $or: filter },
        {
          userId: userId || undefined,
          email: email ? email.toLowerCase() : undefined,
          sizesData,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      supabaseSaved: supabaseSuccess,
      message: "Size editor data synced to Supabase database.",
    });
  } catch (err) {
    console.error("Error saving size editor store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
