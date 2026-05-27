import mongoose from "mongoose";
import dotenv from "dotenv";
import License from "../models/License.js";

dotenv.config({ path: "./server/.env" });

const generateLicenseKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `FN-${segment()}-${segment()}-${segment()}`;
};

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in env");
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const email = args[0] || "test-license@fivenest.in";
  const planId = args[1] || "pro"; // starter, pro, premium, enterprise
  const maxDevices = parseInt(args[2]) || (planId === "starter" ? 1 : planId === "pro" ? 2 : planId === "premium" ? 5 : 10);

  const validPlans = ["starter", "pro", "premium", "enterprise"];
  if (!validPlans.includes(planId)) {
    console.error(`Invalid planId. Must be one of: ${validPlans.join(", ")}`);
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(uri);

  const licenseKey = generateLicenseKey();
  const license = new License({
    licenseKey,
    email: email.toLowerCase(),
    phone: "9999999999",
    planId,
    status: "active",
    maxDevices,
  });

  await license.save();
  console.log("\n========================================");
  console.log("✅ TEST LICENSE CREATED SUCCESSFULLY!");
  console.log(`Email:      ${email}`);
  console.log(`Plan:       ${planId.toUpperCase()}`);
  console.log(`Max Devices: ${maxDevices}`);
  console.log(`License Key: ${licenseKey}`);
  console.log("========================================\n");

  await mongoose.disconnect();
}

run().catch(error => {
  console.error("Error creating license key:", error);
  process.exit(1);
});
