const express = require("express");
const router = express.Router();
const AuthService = require("../services/AuthService");

// OAuth callback for Gmail
router.get("/gmail/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await AuthService.exchangeGmailCode(code);
    // Store tokens securely (in production, use proper session management)
    res.json({
      success: true,
      service: "gmail",
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Gmail auth error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OAuth callback for Asana
router.get("/asana/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await AuthService.exchangeAsanaCode(code);
    res.json({
      success: true,
      service: "asana",
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Asana auth error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get auth URLs for specific service
router.get("/urls/:service", (req, res) => {
  try {
    const { service } = req.params;
    let url = null;

    if (service === "gmail") {
      url = AuthService.getGmailAuthUrl();
    } else if (service === "asana") {
      url = AuthService.getAsanaAuthUrl();
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported service: ${service}`,
      });
    }

    res.json({ success: true, data: { url } });
  } catch (error) {
    console.error(`Error getting ${req.params.service} auth URL:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get auth URLs
router.get("/urls", (req, res) => {
  try {
    const urls = {};

    // Gmail OAuth URL
    try {
      urls.gmail = AuthService.getGmailAuthUrl();
    } catch (error) {
      console.log("Gmail auth URL error:", error.message);
      urls.gmail = null;
    }

    // Asana OAuth URL (skip if using personal access token)
    try {
      urls.asana = AuthService.getAsanaAuthUrl();
    } catch (error) {
      console.log("Asana auth URL error:", error.message);
      urls.asana = null;
    }

    res.json({ success: true, data: urls });
  } catch (error) {
    console.error("Error getting auth URLs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check authentication status
router.get("/status", (req, res) => {
  try {
    const status = {
      gmail: AuthService.isGmailAuthenticated(),
      asana: AuthService.isAsanaAuthenticated(),
      cybozu: AuthService.isCybozuAuthenticated(),
    };
    res.json({ success: true, data: status });
  } catch (error) {
    console.error("Error checking auth status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
