import mongoose from "mongoose";
import dotenv from "dotenv";
import License from "../models/License.js";

dotenv.config({ path: "./server/.env" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in env");
    process.exit(1);
  }
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  const key = "FN-25PX-AYCT-FQT4";
  console.log(`Searching for key: ${key}`);
  const lic = await License.findOne({ licenseKey: key });
  if (lic) {
    console.log("License Found:", JSON.stringify(lic, null, 2));
  } else {
    console.log("License NOT found.");
  }
  await mongoose.disconnect();
}

run().catch(console.error);
