/**
 * Central configuration file for all subscription plans.
 * You can edit features, change levels, and add/remove PSD templates here.
 */
export const PLAN_CONFIG = {
  starter: {
    name: "Starter Plan",
    level: 1,
    monthlyPrice: 500,
    yearlyPrice: 5000,
    maxDevices: 1,
    maxFilesPerMonth: 500,
    features: {
      csvImport: true,
      resizeInches: true,
      customNaming: false,
      fastExport: false,
      multiDeviceSync: false,
      customScripting: false
    },
    templates: [
      { id: "s1", name: "Basic Jersey Front", url: "https://www.fivenest.in/downloads/templates/starter/basic-front.psd" },
      { id: "s2", name: "Basic Jersey Back", url: "https://www.fivenest.in/downloads/templates/starter/basic-back.psd" }
    ]
  },
  pro: {
    name: "Pro Plan",
    level: 2,
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    maxDevices: 1,
    maxFilesPerMonth: 2000,
    features: {
      csvImport: true,
      resizeInches: true,
      customNaming: true,
      fastExport: true,
      multiDeviceSync: false,
      customScripting: false
    },
    templates: [
      { id: "s1", name: "Basic Jersey Front", url: "https://www.fivenest.in/downloads/templates/starter/basic-front.psd" },
      { id: "s2", name: "Basic Jersey Back", url: "https://www.fivenest.in/downloads/templates/starter/basic-back.psd" },
      { id: "p1", name: "Pro Jersey Collar Pack", url: "https://www.fivenest.in/downloads/templates/pro/collar-pack.psd" },
      { id: "p2", name: "Pro Jersey Sleeve Pack", url: "https://www.fivenest.in/downloads/templates/pro/sleeve-pack.psd" }
    ]
  },
  premium: {
    name: "Premium Plan",
    level: 3,
    monthlyPrice: 1250,
    yearlyPrice: 12500,
    maxDevices: 1,
    maxFilesPerMonth: 5000,
    features: {
      csvImport: true,
      resizeInches: true,
      customNaming: true,
      fastExport: true,
      multiDeviceSync: false,
      customScripting: false
    },
    templates: [
      { id: "s1", name: "Basic Jersey Front", url: "https://www.fivenest.in/downloads/templates/starter/basic-front.psd" },
      { id: "s2", name: "Basic Jersey Back", url: "https://www.fivenest.in/downloads/templates/starter/basic-back.psd" },
      { id: "p1", name: "Pro Jersey Collar Pack", url: "https://www.fivenest.in/downloads/templates/pro/collar-pack.psd" },
      { id: "p2", name: "Pro Jersey Sleeve Pack", url: "https://www.fivenest.in/downloads/templates/pro/sleeve-pack.psd" },
      { id: "pr1", name: "Premium Full-Sleeve Pattern", url: "https://www.fivenest.in/downloads/templates/premium/full-sleeve.psd" },
      { id: "pr2", name: "Premium Raglan Jersey", url: "https://www.fivenest.in/downloads/templates/premium/raglan.psd" }
    ]
  },
  enterprise: {
    name: "Enterprise Plan",
    level: 4,
    monthlyPrice: 1500,
    yearlyPrice: 15000,
    maxDevices: 1,
    maxFilesPerMonth: -1, // -1 means Unlimited
    features: {
      csvImport: true,
      resizeInches: true,
      customNaming: true,
      fastExport: true,
      multiDeviceSync: false,
      customScripting: true
    },
    templates: [
      { id: "s1", name: "Basic Jersey Front", url: "https://www.fivenest.in/downloads/templates/starter/basic-front.psd" },
      { id: "s2", name: "Basic Jersey Back", url: "https://www.fivenest.in/downloads/templates/starter/basic-back.psd" },
      { id: "p1", name: "Pro Jersey Collar Pack", url: "https://www.fivenest.in/downloads/templates/pro/collar-pack.psd" },
      { id: "p2", name: "Pro Jersey Sleeve Pack", url: "https://www.fivenest.in/downloads/templates/pro/sleeve-pack.psd" },
      { id: "pr1", name: "Premium Full-Sleeve Pattern", url: "https://www.fivenest.in/downloads/templates/premium/full-sleeve.psd" },
      { id: "pr2", name: "Premium Raglan Jersey", url: "https://www.fivenest.in/downloads/templates/premium/raglan.psd" },
      { id: "e1", name: "Enterprise Custom Patterns", url: "https://www.fivenest.in/downloads/templates/enterprise/custom-patterns.psd" },
      { id: "e2", name: "Enterprise Sublimation Pack", url: "https://www.fivenest.in/downloads/templates/enterprise/sublimation.psd" }
    ]
  }
};
