import axios from "axios";
import { Task, TasksResponse } from "../types/types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒に延長♪
});

export class TaskService {
  static async getAllTasks(): Promise<TasksResponse> {
    try {
      console.log("🔄 Frontend: Requesting tasks from API...");
      const response = await api.get("/tasks");
      console.log("📥 Frontend: API response received:", response);
      console.log("📊 Frontend: Response data:", response.data);
      console.log("📋 Frontend: Tasks data:", response.data.data);
      console.log("📋 Frontend: Tasks array:", response.data.data?.tasks);
      console.log(
        "📋 Frontend: Tasks count:",
        response.data.data?.tasks?.length
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Frontend: Error fetching tasks:", error);
      throw new Error("Failed to fetch tasks");
    }
  }

  static async getTasksByService(service: string): Promise<TasksResponse> {
    try {
      const response = await api.get(`/tasks/${service}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${service} tasks:`, error);
      throw new Error(`Failed to fetch ${service} tasks`);
    }
  }

  static async refreshTasks(): Promise<TasksResponse> {
    try {
      const response = await api.post("/tasks/refresh");
      return response.data.data;
    } catch (error) {
      console.error("Error refreshing tasks:", error);
      throw new Error("Failed to refresh tasks");
    }
  }

  static getPriorityColor(priority: number): string {
    switch (priority) {
      case 3:
        return "text-red-300 bg-red-900/30 border border-red-500/30";
      case 2:
        return "text-yellow-300 bg-yellow-900/30 border border-yellow-500/30";
      case 1:
        return "text-green-300 bg-green-900/30 border border-green-500/30";
      default:
        return "text-gray-300 bg-gray-700/50 border border-gray-600";
    }
  }

  static getPriorityText(priority: number): string {
    switch (priority) {
      case 3:
        return "高";
      case 2:
        return "中";
      case 1:
        return "低";
      default:
        return "不明";
    }
  }

  static getServiceIcon(service: string): string {
    switch (service) {
      case "cybozu":
        return "🏢";
      case "gmail":
        return "📧";
      case "asana":
        return "📊";
      default:
        return "📋";
    }
  }

  static getServiceColor(service: string): string {
    switch (service) {
      case "cybozu":
        return "bg-blue-900/30 text-blue-300 border border-blue-500/30";
      case "gmail":
        return "bg-red-900/30 text-red-300 border border-red-500/30";
      case "asana":
        return "bg-purple-900/30 text-purple-300 border border-purple-500/30";
      default:
        return "bg-gray-700/50 text-gray-300 border border-gray-600";
    }
  }
}
