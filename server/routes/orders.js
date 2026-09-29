import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import mongoose from "mongoose";

const router = express.Router();

// Define OrderStore schema in MongoDB for backup
const orderStoreSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true, trim: true },
    orderStore: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongoOrderStore = mongoose.models.OrderStore || mongoose.model("OrderStore", orderStoreSchema);

/**
 * @route GET /api/orders/store
 * @desc Retrieve order definitions from Supabase (or MongoDB backup)
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
        .eq("plugin_type", "order_definitions")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.details) {
        return res.status(200).json({ success: true, source: "supabase", orderStore: data[0].details });
      }
    }

    // 2. Try MongoDB backup
    const query = [];
    if (userId) query.push({ userId });
    if (email) query.push({ email: email.toLowerCase() });

    const doc = await MongoOrderStore.findOne({ $or: query }).sort({ updatedAt: -1 });
    if (doc && doc.orderStore) {
      return res.status(200).json({ success: true, source: "mongodb", orderStore: doc.orderStore });
    }

    return res.status(200).json({ success: true, orderStore: null });
  } catch (err) {
    console.error("Error fetching order store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/orders/store
 * @desc Save order definitions into Supabase and MongoDB
 */
router.post("/store", async (req, res) => {
  const { userId, email, orderStore } = req.body;

  if (!orderStore) {
    return res.status(400).json({ success: false, message: "Missing orderStore data." });
  }

  try {
    let supabaseSuccess = false;

    // 1. Save to Supabase using Admin client
    if (supabaseAdmin && userId) {
      try {
        const { error } = await supabaseAdmin.from("plugin_usage_logs").insert({
          user_id: userId,
          plugin_type: "order_definitions",
          action: "sync_orders",
          details: orderStore,
        });
        if (!error) supabaseSuccess = true;
      } catch (sbErr) {
        console.warn("Supabase admin order save warning:", sbErr);
      }
    }

    // 2. Save / Upsert to MongoDB
    if (userId || email) {
      const filter = [];
      if (userId) filter.push({ userId });
      if (email) filter.push({ email: email.toLowerCase() });

      await MongoOrderStore.findOneAndUpdate(
        { $or: filter },
        {
          userId: userId || undefined,
          email: email ? email.toLowerCase() : undefined,
          orderStore,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      supabaseSaved: supabaseSuccess,
      message: "Order definitions synced to cloud database.",
    });
  } catch (err) {
    console.error("Error saving order store:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
