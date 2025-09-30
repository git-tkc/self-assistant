const asana = require("asana");
// Remove TaskService import to avoid circular dependency

class AsanaService {
  constructor() {
    this.client = null;
    // Initialize with personal access token if available
    if (process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      this.initializeClient(process.env.ASANA_PERSONAL_ACCESS_TOKEN);
    }
  }

  initializeClient(accessToken) {
    try {
      this.client = asana.Client.create().useAccessToken(accessToken);
      console.log("✅ Asana client initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Asana client:", error.message);
      this.client = null;
    }
  }

  async getTasks(user) {
    console.log("🔍 AsanaService.getTasks called");

    // Try to initialize if not already done
    if (!this.client && process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      console.log("🔧 Initializing Asana client...");
      this.initializeClient(process.env.ASANA_PERSONAL_ACCESS_TOKEN);
    }

    if (!this.client) {
      console.log("❌ Asana client not available");
      throw new Error(
        "Asana not configured - set ASANA_PERSONAL_ACCESS_TOKEN in .env"
      );
    }

    try {
      console.log("📡 Fetching Asana workspaces...");
      const workspaces = await this.client.workspaces.findAll();
      console.log("🏢 Found workspaces:", workspaces.data?.length || 0);

      const workspace = workspaces.data[0];

      if (!workspace) {
        console.log("❌ No workspace found");
        throw new Error("No Asana workspace found");
      }

      console.log("🏢 Using workspace:", workspace.name, workspace.gid);

      // Get tasks assigned to me that are incomplete
      console.log("📋 Fetching tasks from workspace...");
      const response = await this.client.tasks.findAll({
        assignee: "me",
        workspace: workspace.gid,
        completed_since: "now",
        opt_fields: [
          "name",
          "notes",
          "due_date",
          "completed",
          "created_at",
          "modified_at",
          "permalink_url",
          "assignee",
          "projects",
        ].join(","),
      });

      console.log(
        "📊 Raw tasks response:",
        response.data?.length || 0,
        "tasks found"
      );
      const tasks = response.data || [];

      if (tasks.length === 0) {
        console.log(
          "ℹ️ No tasks found - checking if you have tasks assigned to you in Asana"
        );
      }

      const normalizedTasks = tasks.map((task) => ({
        id: task.gid,
        title: task.name,
        description: task.notes || "",
        dueDate: task.due_date,
        priority: 2, // Default medium priority
        status: task.completed ? "completed" : "open",
        assignee: task.assignee?.name || "me",
        createdDate: task.created_at,
        updatedDate: task.modified_at,
        url: task.permalink_url,
        service: "asana",
      }));

      console.log(
        "✅ Returning",
        normalizedTasks.length,
        "normalized Asana tasks"
      );
      return normalizedTasks;
    } catch (error) {
      console.error("Asana API Error:", error);
      throw new Error(`Asana API Error: ${error.message}`);
    }
  }

  async testConnection() {
    // Personal Access Tokenが設定されている場合は初期化
    if (!this.client && process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      console.log("🔧 Asana: Initializing client for test connection...");
      this.initializeClient(process.env.ASANA_PERSONAL_ACCESS_TOKEN);
    }

    if (!this.client) {
      return {
        connected: false,
        error: "Personal access token not configured",
      };
    }

    try {
      console.log("🧪 Asana: Testing connection...");
      const user = await this.client.users.me();

      // ワークスペースも取得してテスト
      const workspaces = await this.client.workspaces.findAll();

      return {
        connected: true,
        message: `Connected as ${user.name} (${user.email}) with ${workspaces.data.length} workspaces`,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  getAuthUrl() {
    if (process.env.ASANA_PERSONAL_ACCESS_TOKEN) {
      throw new Error("Using personal access token - OAuth not required");
    }

    const clientId = process.env.ASANA_CLIENT_ID;
    const redirectUri =
      process.env.ASANA_REDIRECT_URL ||
      "http://localhost:5000/api/auth/asana/callback";

    if (!clientId) {
      throw new Error(
        "ASANA_CLIENT_ID is not configured in environment variables"
      );
    }

    return `https://app.asana.com/-/oauth_authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=default`;
  }

  async exchangeCodeForTokens(code) {
    const clientId = process.env.ASANA_CLIENT_ID;
    const clientSecret = process.env.ASANA_CLIENT_SECRET;
    const redirectUri =
      process.env.ASANA_REDIRECT_URL ||
      "http://localhost:5000/api/auth/asana/callback";

    if (!clientId || !clientSecret) {
      throw new Error(
        "ASANA_CLIENT_ID or ASANA_CLIENT_SECRET is not configured"
      );
    }

    const response = await fetch("https://app.asana.com/-/oauth_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      this.initializeClient(data.access_token);
    }
    return data;
  }
}

module.exports = new AsanaService();
