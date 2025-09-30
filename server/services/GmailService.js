const { google } = require("googleapis");

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL ||
        "http://localhost:5000/api/auth/gmail/callback"
    );
  }

  // Local normalize function to avoid circular dependency
  normalizeTask(task, service) {
    return {
      id: task.id,
      title: task.title || task.subject || task.name,
      description: task.description || task.body || task.notes || "",
      dueDate: task.dueDate || task.due_date || task.due_on,
      priority: this.normalizePriority(task.priority),
      status: this.normalizeStatus(task.status),
      assignee: task.assignee || task.assigned_to,
      createdDate: task.created_at || task.createdDate,
      updatedDate: task.updated_at || task.updatedDate,
      url: task.url || task.permalink_url,
      service,
    };
  }

  normalizePriority(priority) {
    if (!priority) return 1;

    const priorityMap = {
      high: 3,
      medium: 2,
      low: 1,
      3: 3,
      2: 2,
      1: 1,
    };

    return priorityMap[String(priority).toLowerCase()] || 1;
  }

  normalizeStatus(status) {
    if (!status) return "open";

    const statusMap = {
      new: "open",
      open: "open",
      in_progress: "in_progress",
      completed: "completed",
      done: "completed",
      closed: "completed",
    };

    return statusMap[String(status).toLowerCase()] || "open";
  }

  async getTasks(user) {
    if (!this.oauth2Client.credentials.access_token) {
      throw new Error("Gmail not authenticated");
    }

    try {
      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

      // Get target label from environment variable
      const targetLabel = process.env.GMAIL_TARGET_LABEL;

      // Build query based on whether label is specified
      let query = "is:unread";
      if (targetLabel && targetLabel.trim() !== "") {
        query = `label:${targetLabel.trim()} is:unread`;
      }

      // Get emails with specified query as tasks
      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      const tasks = [];

      const labelInfo =
        targetLabel && targetLabel.trim() !== ""
          ? `with label:${targetLabel}`
          : "(all unread)";
      console.log(
        `📧 Gmail: Found ${messages.length} unread messages ${labelInfo}`
      ); // Get details for each message
      for (const message of messages.slice(0, 20)) {
        // Limit to 20 for performance
        try {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });

          const headers = details.data.payload.headers;
          const subject =
            headers.find((h) => h.name === "Subject")?.value || "No Subject";
          const from =
            headers.find((h) => h.name === "From")?.value || "Unknown";
          const date = headers.find((h) => h.name === "Date")?.value;

          tasks.push(
            this.normalizeTask(
              {
                id: message.id,
                title: `📧 ${subject}`,
                description: `From: ${from}`,
                dueDate: null, // Gmail doesn't have due dates
                priority: 2, // Medium priority for emails
                status: "open",
                assignee: "me",
                createdDate: date,
                updatedDate: date,
                url: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
              },
              "gmail"
            )
          );
        } catch (error) {
          console.error(`Error getting message ${message.id}:`, error);
        }
      }

      return tasks;
    } catch (error) {
      console.error("Gmail API Error:", error);
      throw new Error(`Gmail API Error: ${error.message}`);
    }
  }

  async testConnection() {
    if (!this.oauth2Client.credentials.access_token) {
      return { connected: false, error: "Not authenticated" };
    }

    try {
      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
      const response = await gmail.users.getProfile({ userId: "me" });

      return {
        connected: true,
        email: response.data.emailAddress,
        message: "Connection successful",
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  getAuthUrl() {
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
  }

  async exchangeCodeForTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.setCredentials(tokens);
    return tokens;
  }
}

module.exports = new GmailService();
