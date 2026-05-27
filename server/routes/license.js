import express from "express";
import License from "../models/License.js";
import { PLAN_CONFIG } from "../config/plans.js";

const router = express.Router();

/**
 * @route POST /api/license/verify
 * @desc Verify license key status and activate devices for Photoshop plugin
 */
router.post("/verify", async (req, res) => {
  const { email, licenseKey, deviceId, pluginId } = req.body;

  if (!email || !licenseKey) {
    return res.status(400).json({ success: false, message: "Missing email or licenseKey." });
  }

  try {
    // Find the license key
    const license = await License.findOne({ licenseKey });

    if (!license) {
      return res.status(404).json({ success: false, message: "License key not found." });
    }

    // Verify status
    if (license.status !== "active") {
      return res.status(403).json({ success: false, message: "This license key is currently suspended or inactive." });
    }

    // Verify email association
    if (license.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "This license key does not belong to the provided email address." });
    }

    // Load feature and template configurations for this plan
    const planDetails = PLAN_CONFIG[license.planId];
    if (!planDetails) {
      return res.status(500).json({ success: false, message: "Invalid plan configured on license key." });
    }

    // Map Photoshop UXP Plugin IDs to Plan IDs
    const PLUGIN_ID_TO_PLAN = {
      "92c18351": "starter",
      "d8dcad95": "pro",
      "4355a359": "premium",
      "dd856c50": "enterprise",
      "starter": "starter",
      "pro": "pro",
      "premium": "premium",
      "enterprise": "enterprise"
    };

    const resolvedPluginId = PLUGIN_ID_TO_PLAN[pluginId] || pluginId;

    // Plan and Plugin Security Validation
    if (resolvedPluginId && PLAN_CONFIG[resolvedPluginId]) {
      const requestedPlugin = PLAN_CONFIG[resolvedPluginId];
      // Enforce strict 1-to-1 matching: key planId must exactly match the UXP plugin resolved ID
      if (license.planId !== resolvedPluginId) {
        return res.status(403).json({
          success: false,
          message: `Access denied. A ${planDetails.name} key is not authorized to unlock the ${requestedPlugin.name} plugin.`,
        });
      }
    }

    // Device activation logic (if deviceId is supplied)
    if (deviceId) {
      const isAlreadyActivated = license.activatedDevices.includes(deviceId);

      if (isAlreadyActivated) {
        return res.status(200).json({
          success: true,
          message: "License verified successfully (Device already registered).",
          planId: license.planId,
          features: planDetails.features,
          templates: planDetails.templates,
          maxDevices: license.maxDevices,
          activeDevicesCount: license.activatedDevices.length,
          debug: {
            receivedPluginId: pluginId,
            resolvedPluginId: resolvedPluginId,
            licensePlanId: license.planId,
            hasPlanConfig: !!PLAN_CONFIG[resolvedPluginId]
          }
        });
      }

      // Check if device limit has been hit
      if (license.activatedDevices.length >= license.maxDevices) {
        return res.status(403).json({
          success: false,
          message: `Activation limit exceeded. Your plan (${license.planId.toUpperCase()}) allows a maximum of ${license.maxDevices} device(s).`,
          maxDevices: license.maxDevices,
          activeDevicesCount: license.activatedDevices.length,
        });
      }

      // Register new device
      license.activatedDevices.push(deviceId);
      await license.save();

      return res.status(200).json({
        success: true,
        message: "New device registered and license activated successfully.",
        planId: license.planId,
        features: planDetails.features,
        templates: planDetails.templates,
        maxDevices: license.maxDevices,
        activeDevicesCount: license.activatedDevices.length,
        debug: {
          receivedPluginId: pluginId,
          resolvedPluginId: resolvedPluginId,
          licensePlanId: license.planId,
          hasPlanConfig: !!PLAN_CONFIG[resolvedPluginId]
        }
      });
    }

    // Default verify-only response (without device activation)
    return res.status(200).json({
      success: true,
      message: "License key is active and valid.",
      planId: license.planId,
      features: planDetails.features,
      templates: planDetails.templates,
      maxDevices: license.maxDevices,
      activeDevicesCount: license.activatedDevices.length,
      debug: {
        receivedPluginId: pluginId,
        resolvedPluginId: resolvedPluginId,
        licensePlanId: license.planId,
        hasPlanConfig: !!PLAN_CONFIG[resolvedPluginId]
      }
    });
  } catch (error) {
    console.error("License Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during validation." });
  }
});

/**
 * @route POST /api/license/deactivate
 * @desc Deactivate a device registration for a license
 */
router.post("/deactivate", async (req, res) => {
  const { email, licenseKey, deviceId } = req.body;

  if (!email || !licenseKey || !deviceId) {
    return res.status(400).json({ success: false, message: "Missing email, licenseKey, or deviceId." });
  }

  try {
    const license = await License.findOne({ licenseKey });

    if (!license) {
      return res.status(404).json({ success: false, message: "License key not found." });
    }

    if (license.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "This license key does not belong to the provided email address." });
    }

    // Remove the device registration
    const index = license.activatedDevices.indexOf(deviceId);
    if (index === -1) {
      return res.status(400).json({ success: false, message: "This device is not registered under this license." });
    }

    license.activatedDevices.splice(index, 1);
    await license.save();

    return res.status(200).json({
      success: true,
      message: "Device deactivated successfully.",
      maxDevices: license.maxDevices,
      activeDevicesCount: license.activatedDevices.length,
    });
  } catch (error) {
    console.error("License Deactivation Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during deactivation." });
  }
});

export default router;
