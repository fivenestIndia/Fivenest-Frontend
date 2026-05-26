import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = process.env.PORT || 5000;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret";

// Define a test payload matching Razorpay payment.captured schema
const testPayload = {
  entity: "event",
  account_id: "acc_xxxxxxxxxxxxxx",
  event: "payment.captured",
  contains: ["payment"],
  payload: {
    payment: {
      entity: {
        id: "pay_test_" + Math.random().toString(36).substring(2, 9),
        entity: "payment",
        amount: 175000, // 1750 INR in paisa
        currency: "INR",
        status: "captured",
        order_id: "order_test_" + Math.random().toString(36).substring(2, 9),
        invoice_id: null,
        international: false,
        method: "upi",
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: "Fivenest Photoshop Plugin - Starter Plan License",
        card_id: null,
        bank: null,
        wallet: null,
        vpa: "success@razorpay",
        email: "fivenest.india@gmail.com",
        contact: "+919876543210",
        notes: {
          planId: "starter",
          planName: "Starter",
          email: "fivenest.india@gmail.com",
          phone: "+919876543210",
        },
        fee: 3500,
        tax: 630,
        error_code: null,
        error_description: null,
        error_source: null,
        error_step: null,
        error_reason: null,
        created_at: Math.floor(Date.now() / 1000),
      },
    },
  },
  created_at: Math.floor(Date.now() / 1000),
};

const runSimulation = async () => {
  const bodyString = JSON.stringify(testPayload);

  // Compute signature matching how Express server computes it
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex");

  console.log("Calculated signature:", signature);
  console.log("Sending simulated webhook to server...");

  try {
    const response = await fetch(`http://localhost:${PORT}/api/payment/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: bodyString,
    });

    const text = await response.text();
    console.log(`Server responded with status: ${response.status}`);
    console.log("Response text:", text);

    if (response.ok) {
      console.log("\n✅ Webhook simulation complete. If database configuration is set up:");
      console.log("1. Check your MongoDB atlas collection for new License and Transaction documents.");
      console.log("2. Check the email inbox (or Brevo API dashboard logs) for the license confirmation email.");
    }
  } catch (error) {
    console.error("Simulation failed:", error.message);
    console.log("Ensure the server is running by executing: npm run dev inside the server folder.");
  }
};

runSimulation();
