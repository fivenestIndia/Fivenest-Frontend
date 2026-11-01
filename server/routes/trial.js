import express from "express";
import TrialClaim from "../models/TrialClaim.js";
import { isAuthorizedAdmin } from "./admin.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

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
    const normalizedPhone = TrialClaim.normalizePhone(cleanMobile);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    // Check if an application already exists for this user email
    let existingClaim = await TrialClaim.findOne({ userEmail: cleanEmail });

    // Deduplication checks across past claims
    const duplicateMatches = [];
    let phoneMatch = false;
    let businessMatch = false;
    let ipMatch = false;

    // 1. Phone match check
    if (normalizedPhone) {
      const phoneMatches = await TrialClaim.find({
        userEmail: { $ne: cleanEmail }
      });
      for (const c of phoneMatches) {
        if (TrialClaim.normalizePhone(c.mobile) === normalizedPhone) {
          phoneMatch = true;
          duplicateMatches.push(`Mobile matches existing claim: ${c.businessName} (${c.userEmail})`);
          break;
        }
      }
    }

    // 2. Business name match check
    const normalizedBizName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedBizName.length > 3) {
      const allClaims = await TrialClaim.find({ userEmail: { $ne: cleanEmail } });
      for (const c of allClaims) {
        const otherBiz = (c.businessName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (otherBiz && otherBiz === normalizedBizName) {
          businessMatch = true;
          duplicateMatches.push(`Business name matches existing claim: ${c.businessName} (${c.userEmail})`);
          break;
        }
      }
    }

    // 3. IP address check (flags for review rather than rejecting)
    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      const ipClaims = await TrialClaim.find({
        userEmail: { $ne: cleanEmail },
        ipAddress: clientIp
      });
      if (ipClaims.length > 0) {
        ipMatch = true;
        duplicateMatches.push(`IP address matches ${ipClaims.length} other claim(s)`);
      }
    }

    if (existingClaim) {
      // If user is re-submitting or updating details while pending or clarification requested
      if (existingClaim.stage === "pending_review" || existingClaim.stage === "clarification_requested") {
        existingClaim.businessName = businessName.trim();
        existingClaim.ownerName = ownerName.trim();
        existingClaim.mobile = cleanMobile;
        existingClaim.city = city?.trim() || existingClaim.city;
        existingClaim.state = state?.trim() || existingClaim.state;
        existingClaim.gstin = gstin?.trim() || existingClaim.gstin;
        existingClaim.stage = "pending_review";
        existingClaim.clarificationMessage = "";
        existingClaim.flags = {
          phoneMatch,
          businessMatch,
          ipMatch,
          matchedRecords: duplicateMatches
        };
        await existingClaim.save();
        return res.status(200).json({ success: true, claim: existingClaim, message: "Application updated and submitted for admin review." });
      }

      // If already approved, return active claim
      return res.status(200).json({ success: true, claim: existingClaim, message: "You have an active trial claim." });
    }

    // Create new claim
    const newClaim = new TrialClaim({
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
          note: `Application submitted for business "${businessName.trim()}". ${duplicateMatches.length > 0 ? "⚠️ Flagged duplicate match." : "Clean profile."}`
        }
      ]
    });

    await newClaim.save();

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

    const query = {};
    if (userEmail) query.userEmail = userEmail.toLowerCase().trim();
    else if (userId) query.userId = userId;

    let claim = await TrialClaim.findOne(query);

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
        await claim.save();
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

    const claim = await TrialClaim.findOne({ userEmail: userEmail.toLowerCase().trim() });
    if (!claim || (claim.stage !== "approved_stage1" && claim.stage !== "active_full_trial")) {
      return res.status(400).json({ error: "No active promotional balance found for this user." });
    }

    // Check expiration
    if (claim.expiresAt && new Date() > new Date(claim.expiresAt)) {
      claim.stage = "expired";
      claim.promoBalance = 0;
      await claim.save();
      return res.status(400).json({ error: "Promotional credit has expired (14-day validity ended)." });
    }

    const deductAmount = Math.min(claim.promoBalance, Number(amount));
    claim.promoBalance = Number((claim.promoBalance - deductAmount).toFixed(2));
    claim.creditUsed = Number((claim.creditUsed + deductAmount).toFixed(2));

    claim.decisionHistory.push({
      adminEmail: "System",
      action: "promo_export_deduction",
      amount: deductAmount,
      note: description || `Export deduction: ₹${deductAmount.toFixed(2)}`
    });

    await claim.save();

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
    const claims = await TrialClaim.find().sort({ createdAt: -1 });

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
    const claim = await TrialClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: "Trial claim not found." });
    }

    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let message = "";

    switch (action) {
      // Stage 2: Admin approves business details -> Releases initial ₹100 credit + starts 14-day validity
      case "approve_stage1": {
        const creditAmount = typeof customAmount === "number" ? customAmount : 100;
        claim.stage = "approved_stage1";
        claim.creditGranted = creditAmount;
        claim.promoBalance = creditAmount;
        claim.activatedAt = now;
        claim.expiresAt = fourteenDaysLater;
        claim.clarificationMessage = "";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "approve_stage1",
          amount: creditAmount,
          note: note || `Approved Stage 1: Released ₹${creditAmount} credit. 14-day validity started.`
        });

        // Credit wallet in Supabase
        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          creditAmount,
          `FiveNest Free Trial (Stage 1): ₹${creditAmount.toFixed(2)} credited (Valid for 14 days)`
        );

        message = `Stage 1 approved! ₹${creditAmount} promotional credit released to ${claim.businessName}. Valid until ${fourteenDaysLater.toLocaleDateString()}.`;
        break;
      }

      // Stage 3: Brief onboarding call / verification confirmed -> Releases additional ₹400 credit (total ₹500)
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
          note: note || `Onboarding confirmed: Released ₹${extraCredit} extra credit (Total ₹${claim.creditGranted}).`
        });

        // Credit wallet in Supabase
        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          extraCredit,
          `FiveNest Free Trial (Stage 2 Onboarding): ₹${extraCredit.toFixed(2)} extra credit added (Total ₹500 trial)`
        );

        message = `Onboarding confirmed! Added ₹${extraCredit} additional credit. Total trial credits: ₹${claim.creditGranted}.`;
        break;
      }

      // Fast-Track: Grant full ₹500 immediately with 14-day validity
      case "fast_track_full": {
        const totalAmount = typeof customAmount === "number" ? customAmount : 500;
        claim.stage = "active_full_trial";
        claim.creditGranted = totalAmount;
        claim.promoBalance = totalAmount;
        claim.activatedAt = now;
        claim.expiresAt = fourteenDaysLater;
        claim.clarificationMessage = "";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "fast_track_full",
          amount: totalAmount,
          note: note || `Fast-track full approval: Released full ₹${totalAmount} trial credits.`
        });

        // Credit wallet in Supabase
        await creditUserWalletInSupabase(
          claim.userId,
          claim.userEmail,
          totalAmount,
          `FiveNest Free Trial (Full Fast-Track): ₹${totalAmount.toFixed(2)} credited (Valid for 14 days)`
        );

        message = `Fast-track approved! Full ₹${totalAmount} trial credits released to ${claim.businessName}.`;
        break;
      }

      // Request Clarification / Details
      case "request_clarification": {
        claim.stage = "clarification_requested";
        claim.clarificationMessage = note || "Please provide additional business details or verify your mobile number.";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "request_clarification",
          amount: 0,
          note: claim.clarificationMessage
        });

        message = `Clarification requested from ${claim.businessName}.`;
        break;
      }

      // Reject Claim
      case "reject": {
        claim.stage = "rejected";
        claim.rejectionReason = note || "Ineligible for free trial offer (e.g. duplicate account or unverified business).";

        claim.decisionHistory.push({
          adminEmail: adminEmail.toLowerCase().trim(),
          action: "reject",
          amount: 0,
          note: claim.rejectionReason
        });

        message = `Trial claim for ${claim.businessName} rejected.`;
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    await claim.save();

    return res.status(200).json({
      success: true,
      message,
      claim
    });
  } catch (error) {
    console.error("Admin trial decision error:", error);
    return res.status(500).json({ error: error.message || "Failed to process admin trial decision." });
  }
});

export default router;
