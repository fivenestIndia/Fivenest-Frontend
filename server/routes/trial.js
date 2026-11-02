import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TrialClaim from "../models/TrialClaim.js";
import { isAuthorizedAdmin } from "./admin.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/trial_claims.json");

// In-memory cache of claims for zero-latency lookups
const claimsCache = new Map();

// Helper to normalize phone
function cleanPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(2);
  if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.slice(1);
  return cleaned;
}

// Load claims from local disk on startup
function loadLocalClaims() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const list = JSON.parse(raw);
      for (const item of list) {
        if (item.id) claimsCache.set(String(item.id), item);
        if (item.userEmail) claimsCache.set(item.userEmail.toLowerCase().trim(), item);
      }
    }
  } catch (e) {
    console.warn("Could not read local trial claims file:", e.message);
  }
}
loadLocalClaims();

// Persist claims to local disk
function persistLocalClaims() {
  try {
    const list = Array.from(new Set(claimsCache.values()));
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save local trial claims file:", e.message);
  }
}

// Sync claim to Supabase plugin_usage_logs
async function syncClaimToSupabase(claim) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from("plugin_usage_logs").insert({
      user_id: claim.userId || null,
      plugin_type: "trial_claim",
      action: claim.stage || "pending_review",
      details: claim,
    });
  } catch (e) {
    console.warn("Supabase trial log sync warning:", e.message);
  }
}

// Sync factory business details to user profile in Supabase
async function syncUserProfileInSupabase(userId, email, details) {
  if (!supabaseAdmin) return;
  try {
    let resolvedId = userId;
    if (!resolvedId && email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();
      if (profile?.id) resolvedId = profile.id;
    }
    if (resolvedId) {
      await supabaseAdmin.from("profiles").update({
        company_name: details.businessName,
        full_name: details.ownerName,
        phone: details.mobile,
        city: details.city,
        state: details.state,
        gstin: details.gstin,
        updated_at: new Date().toISOString()
      }).eq("id", resolvedId);
    }
  } catch (e) {
    console.warn("User profile factory sync warning:", e.message);
  }
}

/**
 * Helper to update user's wallet in Supabase with trial credits
 */
async function creditUserWalletInSupabase(userId, email, amount, description) {
  if (!supabaseAdmin) return null;
  try {
    let resolvedId = userId;
    if (!resolvedId && email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();
      if (profile?.id) resolvedId = profile.id;
    }

    if (!resolvedId) {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
      const matched = authList?.users?.find(u => u.email?.toLowerCase().trim() === email.toLowerCase().trim());
      if (matched) resolvedId = matched.id;
    }

    if (!resolvedId) return null;

    // Fetch current wallet balance
    const { data: currentWallet } = await supabaseAdmin
      .from("wallet")
      .select("balance")
      .eq("user_id", resolvedId)
      .maybeSingle();

    const currentBal = currentWallet?.balance ? parseFloat(currentWallet.balance) : 0;
    const newBal = Number((currentBal + amount).toFixed(2));

    // Upsert wallet
    await supabaseAdmin
      .from("wallet")
      .upsert({
        user_id: resolvedId,
        balance: newBal,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    // Record credit transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: resolvedId,
      amount: amount,
      transaction_type: "promo_trial_credit",
      description: description || `FiveNest Free Trial Credit: ₹${amount.toFixed(2)} (14-day validity)`,
      created_at: new Date().toISOString()
    });

    return newBal;
  } catch (err) {
    console.error("Error crediting user wallet in Supabase:", err);
    return null;
  }
}

/**
 * Unified finder: checks in-memory cache, then Supabase, then MongoDB (if connected)
 */
async function findClaimByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check in-memory cache first (instant)
  if (claimsCache.has(cleanEmail)) {
    return claimsCache.get(cleanEmail);
  }

  // 2. Try MongoDB only if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await TrialClaim.findOne({ userEmail: cleanEmail });
      if (doc) {
        const obj = doc.toObject();
        obj.id = String(doc._id);
        claimsCache.set(cleanEmail, obj);
        claimsCache.set(obj.id, obj);
        return obj;
      }
    } catch (e) {
      console.warn("MongoDB claim lookup skipped:", e.message);
    }
  }

  // 3. Try Supabase plugin_usage_logs
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin
        .from("plugin_usage_logs")
        .select("details")
        .eq("plugin_type", "trial_claim")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        for (const row of data) {
          if (row?.details?.userEmail?.toLowerCase().trim() === cleanEmail) {
            const c = row.details;
            claimsCache.set(cleanEmail, c);
            if (c.id) claimsCache.set(String(c.id), c);
            return c;
          }
        }
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Unified save helper
 */
async function saveClaimToStore(claim) {
  const cleanEmail = claim.userEmail.toLowerCase().trim();
  const idStr = String(claim.id || claim._id || `trial_${Date.now()}`);
  claim.id = idStr;
  claim.updatedAt = new Date().toISOString();

  // Update in-memory
  claimsCache.set(cleanEmail, claim);
  claimsCache.set(idStr, claim);

  // Write to disk
  persistLocalClaims();

  // Sync to Supabase non-blocking
  syncClaimToSupabase(claim).catch(() => {});

  // Sync to MongoDB only if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await TrialClaim.findOneAndUpdate(
        { userEmail: cleanEmail },
        claim,
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn("MongoDB claim save skipped:", e.message);
    }
  }

  return claim;
}

/**
 * @route POST /api/trial/apply
 * @desc Submit business details for ₹500 Free Trial Offer
 */
router.post("/apply", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      businessName,
      ownerName,
      mobile,
      city,
      state,
      gstin,
      deviceFingerprint
    } = req.body;

    if (!userEmail || !businessName || !mobile || !ownerName) {
      return res.status(400).json({ error: "Email, business name, owner name, and mobile number are required." });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const cleanMobile = mobile.trim();
    const normalizedPhone = cleanPhone(cleanMobile);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    // Sync factory profile to Supabase profile in background
    syncUserProfileInSupabase(userId, cleanEmail, {
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      mobile: cleanMobile,
      city: city?.trim() || "",
      state: state?.trim() || "",
      gstin: gstin?.trim() || ""
    }).catch(() => {});

    // Check if an application already exists for this user email
    let existingClaim = await findClaimByEmail(cleanEmail);

    // Deduplication checks across past claims
    const duplicateMatches = [];
    let phoneMatch = false;
    let businessMatch = false;
    let ipMatch = false;

    const allClaims = Array.from(new Set(claimsCache.values())).filter(
      c => c.userEmail && c.userEmail.toLowerCase().trim() !== cleanEmail
    );

    // 1. Phone match check
    if (normalizedPhone) {
      for (const c of allClaims) {
        if (cleanPhone(c.mobile) === normalizedPhone) {
          phoneMatch = true;
          duplicateMatches.push(`Mobile matches existing claim: ${c.businessName} (${c.userEmail})`);
          break;
        }
      }
    }

    // 2. Business name match check
    const normalizedBizName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedBizName.length > 3) {
      for (const c of allClaims) {
        const otherBiz = (c.businessName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (otherBiz && otherBiz === normalizedBizName) {
          businessMatch = true;
          duplicateMatches.push(`Business name matches existing claim: ${c.businessName} (${c.userEmail})`);
          break;
        }
      }
    }

    // 3. IP address check
    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      const matchIpCount = allClaims.filter(c => c.ipAddress === clientIp).length;
      if (matchIpCount > 0) {
        ipMatch = true;
        duplicateMatches.push(`IP address matches ${matchIpCount} other claim(s)`);
      }
    }

    if (existingClaim) {
      // If user is updating details while pending or clarification requested
      if (existingClaim.stage === "pending_review" || existingClaim.stage === "clarification_requested") {
        existingClaim.businessName = businessName.trim();
        existingClaim.ownerName = ownerName.trim();
        existingClaim.mobile = cleanMobile;
        existingClaim.city = city?.trim() || existingClaim.city || "";
        existingClaim.state = state?.trim() || existingClaim.state || "";
        existingClaim.gstin = gstin?.trim() || existingClaim.gstin || "";
        existingClaim.stage = "pending_review";
        existingClaim.clarificationMessage = "";
        existingClaim.flags = {
          phoneMatch,
          businessMatch,
          ipMatch,
          matchedRecords: duplicateMatches
        };
        await saveClaimToStore(existingClaim);
        return res.status(200).json({ success: true, claim: existingClaim, message: "Application updated and submitted for admin review." });
      }

      // If already approved, return active claim
      return res.status(200).json({ success: true, claim: existingClaim, message: "You have an active trial claim." });
    }

    // Create new claim
    const newClaim = {
      id: `trial_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: userId || "",
      userEmail: cleanEmail,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      mobile: cleanMobile,
      city: city?.trim() || "",
      state: state?.trim() || "",
      gstin: gstin?.trim() || "",
      stage: "pending_review",
      creditGranted: 0,
      creditUsed: 0,
      promoBalance: 0,
      ordersPortalTrial: true,
      ipAddress: clientIp,
      userAgent: req.headers["user-agent"] || "",
      deviceFingerprint: deviceFingerprint || "",
      flags: {
        phoneMatch,
        businessMatch,
        ipMatch,
        matchedRecords: duplicateMatches
      },
      decisionHistory: [
        {
          adminEmail: "System",
          action: "application_submitted",
          amount: 0,
          note: `Application submitted for business "${businessName.trim()}". ${duplicateMatches.length > 0 ? "⚠️ Flagged duplicate match." : "Clean profile."}`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    await saveClaimToStore(newClaim);

    return res.status(201).json({
      success: true,
      claim: newClaim,
      message: "Application submitted! Once approved by admin, ₹100 credit will be added immediately (valid for 14 days)."
    });
  } catch (error) {
    console.error("Error submitting trial application:", error);
    return res.status(500).json({ error: error.message || "Failed to submit trial application." });
  }
});

/**
 * @route GET /api/trial/status
 * @desc Get current user's trial offer status and check expiration
 */
router.get("/status", async (req, res) => {
  try {
    const { userEmail, userId } = req.query;
    if (!userEmail && !userId) {
      return res.status(400).json({ error: "userEmail or userId is required" });
    }

    const cleanEmail = (userEmail || "").toLowerCase().trim();
    let claim = await findClaimByEmail(cleanEmail);

    if (!claim) {
      return res.status(200).json({
        hasApplied: false,
        stage: "not_applied",
        promoBalance: 0,
        offerDetails: {
          totalOffer: 500,
          stage1Credit: 100,
          stage2Credit: 400,
          validityDays: 14
        }
      });
    }

    // Check expiration: 14 days from activatedAt
    if (claim.activatedAt && (claim.stage === "approved_stage1" || claim.stage === "active_full_trial")) {
      const now = new Date();
      const expires = new Date(claim.expiresAt);
      if (now > expires) {
        claim.stage = "expired";
        claim.promoBalance = 0;
        await saveClaimToStore(claim);
      }
    }

    let daysRemaining = 0;
    if (claim.expiresAt && (claim.stage === "approved_stage1" || claim.stage === "active_full_trial")) {
      const diffMs = new Date(claim.expiresAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return res.status(200).json({
      hasApplied: true,
      claim,
      daysRemaining,
      isActive: claim.stage === "approved_stage1" || claim.stage === "active_full_trial"
    });
  } catch (error) {
    console.error("Error retrieving trial status:", error);
    return res.status(500).json({ error: error.message || "Failed to retrieve trial status." });
  }
});

/**
 * @route POST /api/trial/deduct
 * @desc Deduct promotional credits for an export
 */
router.post("/deduct", async (req, res) => {
  try {
    const { userEmail, amount, description } = req.body;
    if (!userEmail || !amount) {
      return res.status(400).json({ error: "userEmail and amount are required" });
    }

    const claim = await findClaimByEmail(userEmail.toLowerCase().trim());
    if (!claim || (claim.stage !== "approved_stage1" && claim.stage !== "active_full_trial")) {
      return res.status(400).json({ error: "No active promotional balance found for this user." });
    }

    // Check expiration
    if (claim.expiresAt && new Date() > new Date(claim.expiresAt)) {
      claim.stage = "expired";
      claim.promoBalance = 0;
      await saveClaimToStore(claim);
      return res.status(400).json({ error: "Promotional credit has expired (14-day validity ended)." });
    }

    const deductAmount = Math.min(claim.promoBalance, Number(amount));
    claim.promoBalance = Number((claim.promoBalance - deductAmount).toFixed(2));
    claim.creditUsed = Number((claim.creditUsed + deductAmount).toFixed(2));

    claim.decisionHistory = claim.decisionHistory || [];
    claim.decisionHistory.push({
      adminEmail: "System",
      action: "promo_export_deduction",
      amount: deductAmount,
      note: description || `Export deduction: ₹${deductAmount.toFixed(2)}`,
      timestamp: new Date().toISOString()
    });

    await saveClaimToStore(claim);

    return res.status(200).json({
      success: true,
      deducted: deductAmount,
      remainingPromoBalance: claim.promoBalance
    });
  } catch (error) {
    console.error("Error deducting promotional credits:", error);
    return res.status(500).json({ error: error.message || "Failed to deduct promotional credits." });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN MANAGEMENT ENDPOINTS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @route GET /api/trial/admin/all
 * @desc Get all trial claims with filter, risk flags, and decision history
 */
router.get("/admin/all", async (req, res) => {
  const requesterEmail = req.query.adminEmail || req.headers["x-admin-email"];
  if (!requesterEmail || !isAuthorizedAdmin(requesterEmail)) {
    return res.status(403).json({ error: "Access denied. Admin authorization required." });
  }

  try {
    const claims = Array.from(new Set(claimsCache.values())).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const stats = {
      total: claims.length,
      pending: claims.filter(c => c.stage === "pending_review").length,
      stage1Approved: claims.filter(c => c.stage === "approved_stage1").length,
      fullTrialActive: claims.filter(c => c.stage === "active_full_trial").length,
      clarification: claims.filter(c => c.stage === "clarification_requested").length,
      rejected: claims.filter(c => c.stage === "rejected").length,
      flaggedDuplicates: claims.filter(c => c.flags?.phoneMatch || c.flags?.businessMatch || c.flags?.ipMatch).length,
      totalCreditDispatched: claims.reduce((sum, c) => sum + (c.creditGranted || 0), 0),
      totalCreditUsed: claims.reduce((sum, c) => sum + (c.creditUsed || 0), 0)
    };

    return res.status(200).json({
      success: true,
      stats,
      claims
    });
  } catch (error) {
    console.error("Admin fetch trials error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch trial claims." });
  }
});

/**
 * @route POST /api/trial/admin/decision
 * @desc Admin action on a trial claim: approve_stage1, approve_stage2_onboarding, fast_track_full, request_clarification, reject
 */
router.post("/admin/decision", async (req, res) => {
  const { adminEmail, claimId, action, note, customAmount } = req.body;

  if (!adminEmail || !isAuthorizedAdmin(adminEmail)) {
    return res.status(403).json({ error: "Access denied. Only authorized admins can review trial claims." });
  }

  if (!claimId || !action) {
    return res.status(400).json({ error: "claimId and action are required." });
  }

  try {
    const cleanId = String(claimId);
    let claim = claimsCache.get(cleanId);
    if (!claim) {
      for (const item of claimsCache.values()) {
        if (item.id === cleanId || item._id === cleanId) {
          claim = item;
          break;
        }
      }
    }

    if (!claim) {
      return res.status(404).json({ error: "Trial claim not found." });
    }

    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    claim.decisionHistory = claim.decisionHistory || [];

    let message = "";

    switch (action) {
      case "approve_stage1": {
        const creditAmount = typeof customAmount === "number" ? customAmount : 100;
        claim.stage = "approved_stage1";
        claim.creditGranted = creditAmount;
        claim.promoBalance = creditAmount;
        claim.activatedAt = now.toISOString();
        claim.expiresAt = fourteenDaysLater.toISOString();
        claim.clarificationMessage = "";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "approve_stage1",
          amount: creditAmount,
          note: note || `Approved Stage 1: Released ₹${creditAmount} credit. 14-day validity started.`,
          timestamp: now.toISOString()
        });

        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          creditAmount,
          `FiveNest Free Trial (Stage 1): ₹${creditAmount.toFixed(2)} credited (Valid for 14 days)`
        );

        message = `Stage 1 approved! ₹${creditAmount} promotional credit released to ${claim.businessName}. Valid until ${fourteenDaysLater.toLocaleDateString()}.`;
        break;
      }

      case "approve_stage2_onboarding": {
        const extraCredit = typeof customAmount === "number" ? customAmount : 400;
        claim.stage = "active_full_trial";
        claim.creditGranted = (claim.creditGranted || 100) + extraCredit;
        claim.promoBalance = Number(((claim.promoBalance || 0) + extraCredit).toFixed(2));
        claim.onboardingNotes = note || "Onboarding verified by admin.";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "approve_stage2_onboarding",
          amount: extraCredit,
          note: note || `Onboarding confirmed: Released ₹${extraCredit} extra credit (Total ₹${claim.creditGranted}).`,
          timestamp: now.toISOString()
        });

        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          extraCredit,
          `FiveNest Free Trial (Stage 2 Onboarding): ₹${extraCredit.toFixed(2)} extra credit added (Total ₹500 trial)`
        );

        message = `Onboarding confirmed! Added ₹${extraCredit} additional credit. Total trial credits: ₹${claim.creditGranted}.`;
        break;
      }

      case "fast_track_full": {
        const totalAmount = typeof customAmount === "number" ? customAmount : 500;
        claim.stage = "active_full_trial";
        claim.creditGranted = totalAmount;
        claim.promoBalance = totalAmount;
        claim.activatedAt = now.toISOString();
        claim.expiresAt = fourteenDaysLater.toISOString();
        claim.clarificationMessage = "";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "fast_track_full",
          amount: totalAmount,
          note: note || "Fast-track approval: Full ₹500 granted immediately by admin.",
          timestamp: now.toISOString()
        });

        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          totalAmount,
          `FiveNest Free Trial (Fast-Track Full): ₹${totalAmount.toFixed(2)} credited (Valid for 14 days)`
        );

        message = `Fast-track approved! Full ₹${totalAmount} trial credits released to ${claim.businessName}. Valid for 14 days.`;
        break;
      }

      case "request_clarification": {
        claim.stage = "clarification_requested";
        claim.clarificationMessage = note || "Please verify your mobile number or provide basic business details.";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "request_clarification",
          note: claim.clarificationMessage,
          timestamp: now.toISOString()
        });

        message = `Clarification request recorded for ${claim.businessName}. The user will be prompted to update details.`;
        break;
      }

      case "reject": {
        claim.stage = "rejected";
        claim.rejectionReason = note || "Ineligible for trial offer.";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "reject",
          note: claim.rejectionReason,
          timestamp: now.toISOString()
        });

        message = `Claim for ${claim.businessName} marked as rejected.`;
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    await saveClaimToStore(claim);

    return res.status(200).json({
      success: true,
      message,
      claim
    });
  } catch (error) {
    console.error("Error executing admin trial decision:", error);
    return res.status(500).json({ error: error.message || "Failed to process admin decision." });
  }
});

export default router;
