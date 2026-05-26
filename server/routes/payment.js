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

export default router;
