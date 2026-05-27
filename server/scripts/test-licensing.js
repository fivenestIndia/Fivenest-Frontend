import express from "express";
import License from "../models/License.js";
import licenseRoutes from "../routes/license.js";

const PORT = 5009;

// Mock MongoDB model method
License.findOne = async (query) => {
  const { licenseKey } = query;
  if (licenseKey === "FN-TEST-STARTER-XXXX") {
    return {
      licenseKey: "FN-TEST-STARTER-XXXX",
      email: "test-plugin-security@fivenest.in",
      planId: "starter",
      status: "active",
      maxDevices: 1,
      activatedDevices: [],
      save: async function() { return this; }
    };
  } else if (licenseKey === "FN-TEST-PRO-XXXX") {
    return {
      licenseKey: "FN-TEST-PRO-XXXX",
      email: "test-plugin-security@fivenest.in",
      planId: "pro",
      status: "active",
      maxDevices: 1,
      activatedDevices: [],
      save: async function() { return this; }
    };
  }
  return null;
};

const runTests = async () => {
  console.log("Starting Plugin Security & Locking Verification...");

  const app = express();
  app.use(express.json());
  app.use("/api/license", licenseRoutes);

  const server = app.listen(PORT, async () => {
    console.log(`Mock test server running on port ${PORT}`);

    const testEmail = "test-plugin-security@fivenest.in";
    const starterKey = "FN-TEST-STARTER-XXXX";
    const proKey = "FN-TEST-PRO-XXXX";

    const verifyLicense = async (email, key, pluginId) => {
      try {
        const response = await fetch(`http://localhost:${PORT}/api/license/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            licenseKey: key,
            pluginId: pluginId
          })
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { status: 500, error: error.message };
      }
    };

    // TEST 1: Starter key used to unlock Starter plugin 92c18351 (EXPECT SUCCESS)
    console.log("\n--- TEST 1: Starter License Key on Starter UXP Plugin ID (92c18351) ---");
    const result1 = await verifyLicense(testEmail, starterKey, "92c18351");
    if (result1.status === 200 && result1.data.success) {
      console.log("✅ Success! Resolved ID to 'starter' and unlocked plugin.");
      console.log("Delivered Templates:", result1.data.templates.map(t => t.name));
    } else {
      console.error("❌ Test failed!", result1);
    }

    // TEST 2: Starter key used to unlock Pro plugin d8dcad95 (EXPECT BLOCKED)
    console.log("\n--- TEST 2: Starter License Key on Pro UXP Plugin ID (d8dcad95) ---");
    const result2 = await verifyLicense(testEmail, starterKey, "d8dcad95");
    if (result2.status === 403 && !result2.data.success) {
      console.log("✅ Success! Pro plugin blocked the Starter key as expected.");
      console.log("Message returned:", result2.data.message);
    } else {
      console.error("❌ Test failed! Starter key unlocked the Pro plugin.", result2);
    }

    // TEST 3: Pro key used to unlock Pro plugin d8dcad95 (EXPECT SUCCESS)
    console.log("\n--- TEST 3: Pro License Key on Pro UXP Plugin ID (d8dcad95) ---");
    const result3 = await verifyLicense(testEmail, proKey, "d8dcad95");
    if (result3.status === 200 && result3.data.success) {
      console.log("✅ Success! Pro license key successfully unlocked Pro UXP plugin.");
      console.log("Delivered Templates:", result3.data.templates.map(t => t.name));
    } else {
      console.error("❌ Test failed!", result3);
    }

    // TEST 4: Pro key used to unlock Starter plugin 92c18351 (EXPECT BLOCKED - Strict Lock)
    console.log("\n--- TEST 4: Pro License Key on Starter UXP Plugin ID (92c18351) ---");
    const result4 = await verifyLicense(testEmail, proKey, "92c18351");
    if (result4.status === 403 && !result4.data.success) {
      console.log("✅ Success! Pro key was blocked on Starter plugin under strict locking.");
      console.log("Message returned:", result4.data.message);
    } else {
      console.error("❌ Test failed! Pro key unlocked the Starter plugin.", result4);
    }

    console.log("\nStopping mock server...");
    server.close(() => {
      console.log("Mock server stopped.");
      process.exit(0);
    });
  });
};

runTests();
