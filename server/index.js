const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);

  // Debug environment variables
  console.log("🔧 Service Configuration:");
  console.log(
    `  - Cybozu: ${process.env.CYBOZU_DOMAIN ? "Configured" : "Not configured"}`
  );
  console.log(
    `  - Google: ${
      process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `  - Asana: ${
      process.env.ASANA_PERSONAL_ACCESS_TOKEN
        ? "Personal Token"
        : process.env.ASANA_CLIENT_ID
        ? "OAuth"
        : "Not configured"
    }`
  );
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});
