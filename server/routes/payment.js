import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Transaction from "../models/Transaction.js";
import License from "../models/License.js";
import { sendLicenseEmail } from "../services/emailService.js";

const router = express.Router();

// Initialize Razorpay
// Note: When deploying, these should be configured in Render dashboard.
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
  });
};

// Helper function to generate license keys
const generateLicenseKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `FN-${segment()}-${segment()}-${segment()}`;
};

// Helper to determine device limit based on plan
const getMaxDevices = (planId) => {
  switch (planId) {
    case "starter": return 1;
    case "pro": return 2;
    case "premium": return 5;
    case "enterprise": return 10;
    default: return 1;
  }
};

/**
 * @route POST /api/payment/create-link
 * @desc Create a Razorpay payment link for hosted checkout
 */
router.post("/create-link", async (req, res) => {
  const { amount, email, phone, planName, planId, returnUrl } = req.body;

  if (!amount || !email || !phone || !planId || !planName) {
    return res.status(400).json({ error: "Missing required checkout parameters." });
  }

  try {
    const razorpay = getRazorpayInstance();

    // Create payment link using Razorpay Link API
    const paymentLinkOptions = {
      amount: amount * 100, // Razorpay amount is in Paisa (1 INR = 100 Paisa)
      currency: "INR",
      accept_partial: false,
      description: `Fivenest Photoshop Plugin - ${planName} Plan License`,
      customer: {
        name: "Fivenest Customer",
        email: email,
        contact: phone,
      },
      notify: {
        sms: false,
        email: true,
      },
      reminder_enable: true,
      notes: {
        planId: planId,
        planName: planName,
        email: email,
        phone: phone,
      },
      callback_url: `${returnUrl}/success?planId=${planId}&email=${encodeURIComponent(email)}`,
      callback_method: "get",
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    return res.status(200).json({ url: paymentLink.short_url });
  } catch (error) {
    console.error("Razorpay Payment Link Creation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create payment link." });
  }
});

/**
 * @route POST /api/payment/webhook
 * @desc Verify and handle Razorpay webhooks (e.g. payment.captured or payment_link.paid)
 */
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.warn("Webhook validation failed: missing signature or secret.");
    return res.status(400).send("Signature verification failed.");
  }

  try {
    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Webhook verification failed: Signature mismatch.");
      return res.status(400).send("Signature verification failed.");
    }

    const { event, payload } = req.body;
    console.log(`Received Razorpay webhook event: ${event}`);

    // We process both standard payment capture and payment link paid events
    if (event === "payment.captured" || event === "payment_link.paid") {
      const paymentEntity = payload.payment.entity;
      const linkEntity = payload.payment_link ? payload.payment_link.entity : null;

      // Extract details from notes (stored on payment link or payment metadata)
      const notes = paymentEntity.notes || (linkEntity ? linkEntity.notes : {}) || {};
      
      const email = notes.email || paymentEntity.email;
      const phone = notes.phone || paymentEntity.contact;
      const planId = notes.planId || "starter";
      const planName = notes.planName || "Starter";
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id || (linkEntity ? linkEntity.id : "N/A");
      const amount = paymentEntity.amount / 100; // Convert Paisa back to INR

      // --- WEB STUDIO WALLET RECHARGE WEBHOOK PROCESSING ---
      if (notes.purpose === "web_studio_recharge" || notes.type === "web_studio_recharge") {
        const userId = notes.userId;
        if (!userId) {
          console.warn("Captured Web Studio recharge, but missing userId in notes.");
          return res.status(200).send("No userId found; transaction logged but skipped wallet recharge.");
        }

        const { supabaseAdmin } = await import("../config/supabase.js");
        if (!supabaseAdmin) {
          console.error("Webhook processing failed: Supabase admin client not initialized.");
          return res.status(500).send("Supabase admin client not initialized on backend.");
        }

        // 1. Log transaction in Supabase
        const { data: wt, error: wtErr } = await supabaseAdmin
          .from("wallet_transactions")
          .insert({
            user_id: userId,
            amount: amount,
            razorpay_order_id: paymentEntity.order_id,
            razorpay_payment_id: paymentEntity.id,
            razorpay_signature: signature,
            status: "completed"
          })
          .select()
          .single();

        if (wtErr) {
          if (wtErr.code === "23505") { // Unique constraint violation (duplicate webhook)
            console.log(`Web Studio transaction ${paymentEntity.id} already processed.`);
            return res.status(200).send("Transaction already processed.");
          }
          console.error("Failed to insert wallet_transaction into Supabase:", wtErr);
          return res.status(500).send("Failed to log transaction in Supabase.");
        }

        // 2. Log credit ledger topup
        const { error: ctErr } = await supabaseAdmin
          .from("credit_transactions")
          .insert({
            user_id: userId,
            amount: amount,
            transaction_type: "topup",
            description: `Razorpay wallet recharge (Payment ID: ${paymentEntity.id})`
          });

        if (ctErr) {
          console.error("Failed to insert credit_transaction into Supabase:", ctErr);
          return res.status(500).send("Failed to load credits into wallet.");
        }

        console.log(`Successfully completed Web Studio wallet recharge of ₹${amount} for user UUID ${userId}`);
        return res.status(200).json({ success: true, message: "Web Studio balance recharged successfully." });
      }

      if (!email) {
        console.warn(`Payment captured (${paymentId}) but no email was found in notes/entity.`);
        return res.status(200).send("No customer email found; logged but skipped fulfillment.");
      }

      // Check if transaction already exists to prevent duplicate processing
      const existingTx = await Transaction.findOne({ paymentId });
      if (existingTx) {
        console.log(`Transaction ${paymentId} already processed.`);
        return res.status(200).send("Transaction already processed.");
      }

      // Save Transaction
      const transaction = new Transaction({
        paymentId,
        orderId,
        email,
        phone,
        amount,
        planId,
        status: "success",
        rawPayload: req.body,
      });
      await transaction.save();

      // Create License
      const licenseKey = generateLicenseKey();
      const maxDevices = getMaxDevices(planId);

      const license = new License({
        licenseKey,
        email,
        phone,
        planId,
        status: "active",
        maxDevices,
      });
      await license.save();

      console.log(`License generated for ${email}: ${licenseKey}`);

      // Send license email via Brevo
      const emailSent = await sendLicenseEmail(email, phone, licenseKey, planId, planName);
      if (!emailSent) {
        console.warn(`Failed to dispatch email for license ${licenseKey} to ${email}`);
      }

      return res.status(200).json({ success: true, message: "Transaction processed and license sent." });
    }

    return res.status(200).send("Unhandled event type.");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).send("Internal Webhook Error");
  }
});

/**
 * @route POST /api/payment/create-studio-order
 * @desc Create a Razorpay Order ID for Web Studio wallet credit topups
 */
router.post("/create-studio-order", async (req, res) => {
  const { amount, userId, email } = req.body;

  if (!amount || !userId) {
    return res.status(400).json({ error: "Missing required checkout parameters (amount, userId)." });
  }

  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // convert INR to paisa
      currency: "INR",
      receipt: `studio_topup_${Date.now()}`,
      notes: {
        purpose: "web_studio_recharge",
        type: "web_studio_recharge",
        userId: userId,
        email: email || ""
      }
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Web Studio Razorpay Order Creation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create Razorpay Order." });
  }
});

/**
 * @route POST /api/payment/verify-studio-payment
 * @desc Verify Razorpay payment signature on backend and credit wallet immediately
 */
router.post("/verify-studio-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
    return res.status(400).json({ error: "Missing required verification parameters." });
  }

  try {
    // 1. Verify Razorpay Signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn("Payment verification failed: Signature mismatch.");
      return res.status(400).json({ error: "Signature verification failed." });
    }

    const { supabaseAdmin } = await import("../config/supabase.js");
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase keys (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured on your backend Render/Vercel server. Please add them in your environment variables dashboard." });
    }

    // 2. Log transaction in Supabase
    const { data: wt, error: wtErr } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: "completed"
      })
      .select()
      .single();

    if (wtErr) {
      if (wtErr.code === "23505") { // Unique constraint violation (already processed by webhook or frontend)
        console.log(`Web Studio transaction ${razorpay_payment_id} already processed.`);
        return res.status(200).json({ success: true, message: "Transaction already processed." });
      }
      console.error("Failed to insert wallet_transaction in verification:", wtErr);
      return res.status(500).json({ error: "Failed to log transaction in database." });
    }

    // 3. Log credit ledger topup
    const { error: ctErr } = await supabaseAdmin
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: "topup",
        description: `Razorpay wallet recharge (Payment ID: ${razorpay_payment_id})`
      });

    if (ctErr) {
      console.error("Failed to insert credit_transaction in verification:", ctErr);
      return res.status(500).json({ error: "Failed to update wallet balance in database." });
    }

    console.log(`Successfully verified and completed Web Studio wallet recharge of ₹${amount} for user UUID ${userId}`);
    return res.status(200).json({ success: true, message: "Payment verified and wallet credited." });

  } catch (error) {
    console.error("Error verifying payment on backend:", error);
    return res.status(500).json({ error: error.message || "Verification failed." });
  }
});

export default router;
