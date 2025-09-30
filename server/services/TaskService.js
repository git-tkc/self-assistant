const CybozuService = require("./CybozuService");
const GmailService = require("./GmailService");
const AsanaService = require("./AsanaService");
const NotificationService = require("./NotificationService");

class TaskService {
  static async getAllTasks(user) {
    const tasks = [];
    const errors = [];
    const serviceCounts = { cybozu: 0, gmail: 0, asana: 0 };

    // Fetch from all services concurrently
    const services = [
      { name: "cybozu", service: CybozuService },
      { name: "gmail", service: GmailService },
      { name: "asana", service: AsanaService },
    ];

    await Promise.allSettled(
      services.map(async ({ name, service }) => {
        try {
          console.log(`📡 Fetching tasks from ${name}...`);
          const serviceTasks = await service.getTasks(user);
          console.log(`📊 ${name} returned ${serviceTasks.length} tasks`);

          const processedTasks = serviceTasks.map((task) => ({
            ...task,
            service: name,
            id: `${name}_${task.id}`,
          }));

          tasks.push(...processedTasks);
          serviceCounts[name] = processedTasks.length;
          console.log(
            `✅ Added ${processedTasks.length} ${name} tasks to collection`
          );
        } catch (error) {
          console.error(`❌ Error fetching ${name} tasks:`, error);
          errors.push({ service: name, error: error.message });
          serviceCounts[name] = 0;

          // エラー通知を送信
          NotificationService.notifyError(name, error.message);
        }
      })
    );

    console.log(`📋 Total tasks collected: ${tasks.length}`);
    console.log(
      `📋 Tasks by service:`,
      tasks.reduce((acc, task) => {
        acc[task.service] = (acc[task.service] || 0) + 1;
        return acc;
      }, {})
    );

    // デスクトップ通知を送信（エラー情報も含める）
    const errorsByService = {};
    errors.forEach((error) => {
      errorsByService[error.service] = error.error;
    });

    NotificationService.notifyTaskUpdate({
      total: tasks.length,
      cybozu: serviceCounts.cybozu,
      gmail: serviceCounts.gmail,
      asana: serviceCounts.asana,
      errors: errorsByService,
    });

    // Sort tasks by priority and due date
    tasks.sort((a, b) => {
      // First by priority (high = 3, medium = 2, low = 1)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    return {
      tasks,
      errors: errors.length > 0 ? errors : null,
      totalCount: tasks.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  static async getTasksByService(serviceName, user) {
    const serviceMap = {
      cybozu: CybozuService,
      gmail: GmailService,
      asana: AsanaService,
    };

    const service = serviceMap[serviceName];
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const tasks = await service.getTasks(user);
    return {
      tasks: tasks.map((task) => ({
        ...task,
        service: serviceName,
        id: `${serviceName}_${task.id}`,
      })),
      service: serviceName,
      lastUpdated: new Date().toISOString(),
    };
  }

  static async refreshAllTasks(user) {
    // Clear any cached data if implemented
    return await this.getAllTasks(user);
  }

  static normalizeTask(task, service) {
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

  static normalizePriority(priority) {
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

  static normalizeStatus(status) {
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
}

module.exports = TaskService;
