import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

export const ADMIN_EMAILS = [
  "fivenest.india@gmail.com",
  "vilesh332.1@gmail.com",
  "wavredeepika9@gmail.com"
];

// Helper to check if email is an authorized admin
export const isAuthorizedAdmin = (email) => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === clean);
};

// Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
  });
};

/**
 * @route POST /api/admin/auth-check
 * @desc Verify if an email is authorized to access the Admin Design Dashboard
 */
router.post("/auth-check", (req, res) => {
  const { email } = req.body;
  if (!email || !isAuthorizedAdmin(email)) {
    return res.status(403).json({ authorized: false, error: "Access denied. Not an authorized admin account." });
  }
  return res.status(200).json({
    authorized: true,
    email: email.toLowerCase().trim(),
    isMainOwner: email.toLowerCase().trim() === "fivenest.india@gmail.com"
  });
});

/**
 * @route GET /api/admin/live-payments
 * @desc Fetch all real/live payments directly from Razorpay API
 */
router.get("/live-payments", async (req, res) => {
  const requesterEmail = req.query.adminEmail || req.headers["x-admin-email"];
  if (!requesterEmail || !isAuthorizedAdmin(requesterEmail)) {
    return res.status(403).json({ error: "Access denied. Admin authorization required." });
  }

  try {
    const razorpay = getRazorpayInstance();
    // Fetch last 100 payments
    const paymentsData = await razorpay.payments.all({ count: 100 });
    const items = paymentsData.items || [];

    // Format items for clean presentation
    const formatted = items.map(p => ({
      id: p.id,
      amount: p.amount ? p.amount / 100 : 0, // Convert paise to INR
      currency: p.currency || "INR",
      status: p.status, // captured, failed, authorized, refunded
      method: p.method, // upi, card, netbanking, wallet
      email: p.email || (p.notes && p.notes.email) || "N/A",
      contact: p.contact || (p.notes && p.notes.phone) || "N/A",
      orderId: p.order_id || "N/A",
      description: p.description || (p.notes && (p.notes.purpose || p.notes.planName)) || "Studio Payment",
      fee: p.fee ? p.fee / 100 : 0,
      tax: p.tax ? p.tax / 100 : 0,
      createdAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : new Date().toISOString(),
      notes: p.notes || {}
    }));

    // Calculate aggregated metrics
    const capturedPayments = formatted.filter(p => p.status === "captured");
    const totalCollected = capturedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = capturedPayments.reduce((sum, p) => sum + (p.fee || 0), 0);
    const netRevenue = Number((totalCollected - totalFees).toFixed(2));

    return res.status(200).json({
      success: true,
      totalCount: formatted.length,
      totalCaptured: capturedPayments.length,
      totalCollected,
      totalFees,
      netRevenue,
      isLiveKey: (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live_"),
      keyIdPreview: (process.env.RAZORPAY_KEY_ID || "").slice(0, 12) + "...",
      payments: formatted
    });
  } catch (error) {
    console.error("Admin Razorpay payments fetch error:", error);
    return res.status(500).json({ error: error.message || "Failed to retrieve live payments from Razorpay." });
  }
});

/**
 * @route GET /api/admin/users-wallets
 * @desc Fetch all users, profiles, and wallet balances using Supabase Admin (bypasses RLS)
 */
router.get("/users-wallets", async (req, res) => {
  const requesterEmail = req.query.adminEmail || req.headers["x-admin-email"];
  if (!requesterEmail || !isAuthorizedAdmin(requesterEmail)) {
    return res.status(403).json({ error: "Access denied. Admin authorization required." });
  }

  try {
    const { supabaseAdmin } = await import("../config/supabase.js");
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client is not initialized on the server." });
    }

    // 1. Fetch all users from Supabase Auth admin
    let authUsers = [];
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      authUsers = authData?.users || [];
    } catch (e) {
      console.warn("Failed to list auth users via admin:", e.message);
    }

    // 2. Fetch all profiles
    let profiles = [];
    try {
      const { data: pData } = await supabaseAdmin.from("profiles").select("*");
      profiles = pData || [];
    } catch (e) {
      console.warn("Failed to fetch profiles:", e.message);
    }

    // 3. Fetch all wallets
    let wallets = [];
    try {
      const { data: wData } = await supabaseAdmin.from("wallet").select("*");
      wallets = wData || [];
    } catch (e) {
      console.warn("Failed to fetch wallets:", e.message);
    }

    // Lookup maps
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const walletMap = new Map(wallets.map(w => [w.user_id, parseFloat(w.balance) || 0]));

    // All distinct user IDs
    const allUserIds = new Set([
      ...authUsers.map(u => u.id),
      ...profiles.map(p => p.id),
      ...wallets.map(w => w.user_id)
    ]);

    const usersList = [];
    for (const uid of allUserIds) {
      const authU = authUsers.find(u => u.id === uid);
      const prof = profileMap.get(uid);
      const balance = walletMap.get(uid) || 0;

      const email = authU?.email || prof?.email || (uid === '06b0361a-d777-4957-9bb1-adb5ca3d0bea' ? 'fivenest.india@gmail.com' : `user-${uid.slice(0, 6)}@fivenest.in`);
      const name = prof?.name || authU?.user_metadata?.full_name || authU?.user_metadata?.name || email.split('@')[0] || 'User';

      usersList.push({
        id: uid,
        name: name,
        email: email,
        balance: Number(balance.toFixed(2)),
        createdAt: authU?.created_at || prof?.created_at || new Date().toISOString()
      });
    }

    // Sort: Main owner first, then by balance desc
    usersList.sort((a, b) => {
      const aOwner = a.email.toLowerCase() === "fivenest.india@gmail.com";
      const bOwner = b.email.toLowerCase() === "fivenest.india@gmail.com";
      if (aOwner) return -1;
      if (bOwner) return 1;
      return b.balance - a.balance;
    });

    const totalWallets = usersList.reduce((sum, u) => sum + u.balance, 0);

    return res.status(200).json({
      success: true,
      totalUsers: usersList.length,
      totalWalletsBalance: Number(totalWallets.toFixed(2)),
      users: usersList
    });
  } catch (error) {
    console.error("Admin users-wallets fetch error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch user accounts and wallets." });
  }
});

/**
 * @route GET /api/admin/ledger
 * @desc Fetch all credit and deduction transactions using Supabase Admin
 */
router.get("/ledger", async (req, res) => {
  const requesterEmail = req.query.adminEmail || req.headers["x-admin-email"];
  if (!requesterEmail || !isAuthorizedAdmin(requesterEmail)) {
    return res.status(403).json({ error: "Access denied. Admin authorization required." });
  }

  try {
    const { supabaseAdmin } = await import("../config/supabase.js");
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured." });
    }

    const { data, error } = await supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, transactions: data || [] });
  } catch (error) {
    console.error("Admin ledger fetch error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch ledger." });
  }
});

/**
 * @route POST /api/admin/adjust-wallet
 * @desc Adjust or set any user's wallet balance directly
 */
router.post("/adjust-wallet", async (req, res) => {
  const { adminEmail, targetUserId, targetEmail, newBalance, adjustment, note } = req.body;

  if (!adminEmail || !isAuthorizedAdmin(adminEmail)) {
    return res.status(403).json({ error: "Access denied. Only authorized admins can modify wallets." });
  }

  if (!targetUserId && !targetEmail) {
    return res.status(400).json({ error: "Target user ID or email is required." });
  }

  try {
    const { supabaseAdmin } = await import("../config/supabase.js");
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client is not initialized on the server." });
    }

    let resolvedUserId = targetUserId;

    // Resolve userId by email if not provided
    if (!resolvedUserId && targetEmail) {
      const { data: usersData, error: userLookupErr } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", targetEmail)
        .maybeSingle();

      if (!userLookupErr && usersData?.id) {
        resolvedUserId = usersData.id;
      } else {
        // Fallback to auth.users if available
        const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
        const matched = authList?.users?.find(u => u.email?.toLowerCase().trim() === targetEmail.toLowerCase().trim());
        if (matched) resolvedUserId = matched.id;
      }
    }

    if (!resolvedUserId) {
      return res.status(404).json({ error: `User not found for ${targetEmail || targetUserId}` });
    }

    // Determine target balance
    let finalBalance = 0;
    if (typeof newBalance === "number") {
      finalBalance = Math.max(0, Number(newBalance.toFixed(2)));
    } else if (typeof adjustment === "number") {
      const { data: currentWallet } = await supabaseAdmin
        .from("wallet")
        .select("balance")
        .eq("user_id", resolvedUserId)
        .maybeSingle();
      const currentBal = currentWallet?.balance ? parseFloat(currentWallet.balance) : 0;
      finalBalance = Math.max(0, Number((currentBal + adjustment).toFixed(2)));
    }

    // 1. Upsert wallet balance
    const { error: walletErr } = await supabaseAdmin
      .from("wallet")
      .upsert({
        user_id: resolvedUserId,
        balance: finalBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (walletErr) {
      console.error("Failed to update wallet in Supabase:", walletErr);
      return res.status(500).json({ error: walletErr.message || "Failed to update wallet in database." });
    }

    // 2. Insert audit trail in credit_transactions
    const auditDesc = note || `Admin balance update by ${adminEmail} (Set to ₹${finalBalance.toFixed(2)})`;
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: resolvedUserId,
      amount: typeof adjustment === "number" ? Math.abs(adjustment) : finalBalance,
      transaction_type: (typeof adjustment === "number" && adjustment < 0) ? "admin_debit" : "admin_credit",
      description: auditDesc,
      created_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: `Wallet for user ${targetEmail || resolvedUserId} successfully updated to ₹${finalBalance.toFixed(2)}`,
      newBalance: finalBalance
    });

  } catch (error) {
    console.error("Admin wallet adjustment error:", error);
    return res.status(500).json({ error: error.message || "Failed to adjust wallet balance." });
  }
});

/**
 * @route POST /api/admin/wipe-test-wallets
 * @desc Reset all non-admin wallets to ₹0.00 while preserving main admin account
 */
router.post("/wipe-test-wallets", async (req, res) => {
  const { adminEmail } = req.body;

  if (!adminEmail || adminEmail.toLowerCase().trim() !== "fivenest.india@gmail.com") {
    return res.status(403).json({ error: "Access denied. Only the main owner account (fivenest.india@gmail.com) can trigger bulk test balance resets." });
  }

  try {
    const { supabaseAdmin } = await import("../config/supabase.js");
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured." });
    }

    // Get main admin user id to exclude
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    const mainUser = authList?.users?.find(u => u.email?.toLowerCase().trim() === "fivenest.india@gmail.com");
    const mainUserId = mainUser?.id;

    if (mainUserId) {
      // Reset all wallets except main admin
      const { error: resetErr } = await supabaseAdmin
        .from("wallet")
        .update({ balance: 0.00 })
        .neq("user_id", mainUserId);

      if (resetErr) {
        return res.status(500).json({ error: resetErr.message });
      }

      // Delete credit transactions except main admin
      await supabaseAdmin
        .from("credit_transactions")
        .delete()
        .neq("user_id", mainUserId);
    }

    return res.status(200).json({ success: true, message: "All non-admin test balances successfully reset to ₹0.00." });
  } catch (error) {
    console.error("Bulk wipe error:", error);
    return res.status(500).json({ error: error.message || "Bulk wipe failed." });
  }
});

export default router;
