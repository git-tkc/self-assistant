const express = require("express");
const router = express.Router();
const TaskService = require("../services/TaskService");

// Get all tasks from all services
router.get("/", async (req, res) => {
  try {
    console.log("🌐 API: GET /api/tasks request received");
    const tasks = await TaskService.getAllTasks(req.user);
    console.log(
      "📤 API: Sending response with",
      tasks.tasks?.length || 0,
      "tasks"
    );
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("❌ API Error fetching tasks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tasks by service
router.get("/:service", async (req, res) => {
  try {
    const { service } = req.params;
    const tasks = await TaskService.getTasksByService(service, req.user);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error(`Error fetching ${service} tasks:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Refresh tasks from all services
router.post("/refresh", async (req, res) => {
  try {
    const tasks = await TaskService.refreshAllTasks(req.user);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error refreshing tasks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
