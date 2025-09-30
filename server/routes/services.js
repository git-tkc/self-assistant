const express = require("express");
const router = express.Router();
const CybozuService = require("../services/CybozuService");
const GmailService = require("../services/GmailService");
const AsanaService = require("../services/AsanaService");

// Get service configurations
router.get("/config", (req, res) => {
  try {
    const config = {
      cybozu: {
        enabled: !!process.env.CYBOZU_DOMAIN,
        domain: process.env.CYBOZU_DOMAIN || null,
      },
      gmail: {
        enabled: !!process.env.GOOGLE_CLIENT_ID,
        clientId: process.env.GOOGLE_CLIENT_ID || null,
      },
      asana: {
        enabled: !!process.env.ASANA_CLIENT_ID,
        clientId: process.env.ASANA_CLIENT_ID || null,
      },
    };
    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error getting service config:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test service connections
router.post("/test/:service", async (req, res) => {
  try {
    const { service } = req.params;
    let result;

    switch (service) {
      case "cybozu":
        result = await CybozuService.testConnection();
        break;
      case "gmail":
        result = await GmailService.testConnection();
        break;
      case "asana":
        result = await AsanaService.testConnection();
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid service" });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error testing ${req.params.service} connection:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
