const GmailService = require("./GmailService");
const AsanaService = require("./AsanaService");

class AuthService {
  constructor() {
    // In production, use proper session/token storage
    this.tokens = {
      gmail: null,
      asana: !!process.env.ASANA_PERSONAL_ACCESS_TOKEN, // Check for personal access token
      cybozu: !!process.env.CYBOZU_API_TOKEN,
    };
  }

  // Gmail OAuth
  getGmailAuthUrl() {
    // Check if Gmail OAuth is properly configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "Gmail OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
      );
    }
    return GmailService.getAuthUrl();
  }

  async exchangeGmailCode(code) {
    const tokens = await GmailService.exchangeCodeForTokens(code);
    this.tokens.gmail = tokens;
    return tokens;
  }

  isGmailAuthenticated() {
    return !!this.tokens.gmail;
  }

  // Asana - now supports both OAuth and Personal Access Token
  getAsanaAuthUrl() {
    // If using personal access token, OAuth is not needed
    if (process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      throw new Error("Using personal access token - OAuth not required");
    }
    return AsanaService.getAuthUrl();
  }

  async exchangeAsanaCode(code) {
    // If using personal access token, OAuth is not needed
    if (process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      throw new Error("Using personal access token - OAuth not required");
    }
    const tokens = await AsanaService.exchangeCodeForTokens(code);
    this.tokens.asana = tokens;
    return tokens;
  }

  isAsanaAuthenticated() {
    // Check for personal access token first, then OAuth token
    return !!process.env.ASANA_PERSONAL_ACCESS_TOKEN || !!this.tokens.asana;
  }

  // Cybozu (uses API token, no OAuth)
  isCybozuAuthenticated() {
    return this.tokens.cybozu;
  }

  // Get all auth status
  getAllAuthStatus() {
    return {
      gmail: this.isGmailAuthenticated(),
      asana: this.isAsanaAuthenticated(),
      cybozu: this.isCybozuAuthenticated(),
    };
  }

  // Clear tokens (logout)
  clearTokens(service = null) {
    if (service) {
      this.tokens[service] = null;
    } else {
      this.tokens = {
        gmail: null,
        asana: null,
        cybozu: this.tokens.cybozu, // Keep cybozu as it's API token based
      };
    }
  }
}

module.exports = new AuthService();
