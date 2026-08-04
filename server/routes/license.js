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
    // Find the license key using either field name
    const license = await License.findOne({
      $or: [{ licenseKey }, { key: licenseKey }]
    });

    if (!license) {
      return res.status(404).json({ success: false, message: "License key not found." });
    }

    // Verify status (support both status and isActive)
    const isLicenseActive = license.status === "active" || license.isActive === true;
    if (!isLicenseActive) {
      return res.status(403).json({ success: false, message: "This license key is currently suspended or inactive." });
    }

    // Verify email association
    if (license.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "This license key does not belong to the provided email address." });
    }

    // Load feature and template configurations for this plan (support planId and planType)
    const resolvedPlanId = license.planId || license.planType;
    const planDetails = PLAN_CONFIG[resolvedPlanId];
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
      if (resolvedPlanId !== resolvedPluginId) {
        return res.status(403).json({
          success: false,
          message: `Access denied. A ${planDetails.name} key is not authorized to unlock the ${requestedPlugin.name} plugin.`,
        });
      }
    }

    // Resolve max allowed devices
    let maxAllowedDevices = license.maxDevices;
    if (maxAllowedDevices === undefined || maxAllowedDevices === null) {
      maxAllowedDevices = resolvedPlanId === "starter" ? 1 : resolvedPlanId === "pro" ? 2 : resolvedPlanId === "premium" ? 5 : 10;
    }

    // Device activation logic (if deviceId is supplied)
    if (deviceId) {
      // Get current list of activated devices (support array and comma-separated string)
      let currentDevices = [];
      if (Array.isArray(license.activatedDevices) && license.activatedDevices.length > 0) {
        currentDevices = [...license.activatedDevices];
      } else if (license.hwid) {
        currentDevices = license.hwid.split(",").map(d => d.trim()).filter(Boolean);
      }

      const isAlreadyActivated = currentDevices.includes(deviceId);

      if (isAlreadyActivated) {
        return res.status(200).json({
          success: true,
          message: "License verified successfully (Device already registered).",
          planId: resolvedPlanId,
          features: planDetails.features,
          templates: planDetails.templates,
          maxDevices: maxAllowedDevices,
          activeDevicesCount: currentDevices.length,
          debug: {
            receivedPluginId: pluginId,
            resolvedPluginId: resolvedPluginId,
            licensePlanId: resolvedPlanId,
            hasPlanConfig: !!PLAN_CONFIG[resolvedPluginId]
          }
        });
      }

      // Check if device limit has been hit
      if (currentDevices.length >= maxAllowedDevices) {
        return res.status(403).json({
          success: false,
          message: `Activation limit exceeded. Your plan (${resolvedPlanId.toUpperCase()}) allows a maximum of ${maxAllowedDevices} device(s).`,
          maxDevices: maxAllowedDevices,
          activeDevicesCount: currentDevices.length,
        });
      }

      // Register new device
      currentDevices.push(deviceId);
      license.activatedDevices = currentDevices;
      license.hwid = currentDevices.join(",");
      if (req.body.os) {
        license.os = req.body.os;
      }
      await license.save();

      return res.status(200).json({
        success: true,
        message: "New device registered and license activated successfully.",
        planId: resolvedPlanId,
        features: planDetails.features,
        templates: planDetails.templates,
        maxDevices: maxAllowedDevices,
        activeDevicesCount: currentDevices.length,
        debug: {
          receivedPluginId: pluginId,
          resolvedPluginId: resolvedPluginId,
          licensePlanId: resolvedPlanId,
          hasPlanConfig: !!PLAN_CONFIG[resolvedPluginId]
        }
      });
    }

    // Default verify-only response (without device activation)
    let currentDevices = [];
    if (Array.isArray(license.activatedDevices) && license.activatedDevices.length > 0) {
      currentDevices = [...license.activatedDevices];
    } else if (license.hwid) {
      currentDevices = license.hwid.split(",").map(d => d.trim()).filter(Boolean);
    }

    return res.status(200).json({
      success: true,
      message: "License key is active and valid.",
      planId: resolvedPlanId,
      features: planDetails.features,
      templates: planDetails.templates,
      maxDevices: maxAllowedDevices,
      activeDevicesCount: currentDevices.length,
      debug: {
        receivedPluginId: pluginId,
        resolvedPluginId: resolvedPluginId,
        licensePlanId: resolvedPlanId,
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
    // Find the license key using either field name
    const license = await License.findOne({
      $or: [{ licenseKey }, { key: licenseKey }]
    });

    if (!license) {
      return res.status(404).json({ success: false, message: "License key not found." });
    }

    if (license.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "This license key does not belong to the provided email address." });
    }

    // Get current list of activated devices (support array and comma-separated string)
    let currentDevices = [];
    if (Array.isArray(license.activatedDevices) && license.activatedDevices.length > 0) {
      currentDevices = [...license.activatedDevices];
    } else if (license.hwid) {
      currentDevices = license.hwid.split(",").map(d => d.trim()).filter(Boolean);
    }

    // Remove the device registration
    const index = currentDevices.indexOf(deviceId);
    if (index === -1) {
      return res.status(400).json({ success: false, message: "This device is not registered under this license." });
    }

    currentDevices.splice(index, 1);
    license.activatedDevices = currentDevices;
    license.hwid = currentDevices.join(",");
    await license.save();

    const resolvedPlanId = license.planId || license.planType;
    let maxAllowedDevices = license.maxDevices;
    if (maxAllowedDevices === undefined || maxAllowedDevices === null) {
      maxAllowedDevices = resolvedPlanId === "starter" ? 1 : resolvedPlanId === "pro" ? 2 : resolvedPlanId === "premium" ? 5 : 10;
    }

    return res.status(200).json({
      success: true,
      message: "Device deactivated successfully.",
      maxDevices: maxAllowedDevices,
      activeDevicesCount: currentDevices.length,
    });
  } catch (error) {
    console.error("License Deactivation Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during deactivation." });
  }
});

export default router;
