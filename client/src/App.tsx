import React, { useState, useEffect } from "react";
import TaskDashboard from "./components/TaskDashboard";
import AuthStatus from "./components/AuthStatus";
import { TaskService } from "./services/TaskService";
import { AuthService } from "./services/AuthService";
import { Task, AuthStatus as IAuthStatus } from "./types/types";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authStatus, setAuthStatus] = useState<IAuthStatus>({
    gmail: false,
    asana: false,
    cybozu: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log("🚀 App: Starting initial data load...");

      // タイムアウトを90秒に設定
      const timeout = new Promise<{ tasks: Task[]; errors: null }>(
        (_, reject) =>
          setTimeout(
            () => reject(new Error("タイムアウト: 90秒経過しました")),
            90000
          )
      );

      const [authData, tasksData] = await Promise.all([
        AuthService.getAuthStatus(),
        Promise.race([TaskService.getAllTasks(), timeout]).catch((err: any) => {
          console.warn("⚠️ App: Task loading failed:", err);
          return { tasks: [], errors: null };
        }),
      ]);

      console.log("🔐 App: Auth status received:", authData);
      console.log("📋 App: Tasks data received:", tasksData);
      console.log(
        "📊 App: Setting tasks count:",
        tasksData?.tasks?.length || 0
      );

      setAuthStatus(authData);
      setTasks(tasksData.tasks || []);

      console.log("✅ App: Initial data load complete");
    } catch (err) {
      console.error("❌ App: Initial data load error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TaskService.refreshTasks();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🤖 My Personal Assistant
              </h1>
              <p className="mt-1 text-sm text-gray-300">
                サイボウズ、Gmail、Asanaのタスクを一箇所で管理
              </p>
            </div>
            <button
              onClick={refreshTasks}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {loading ? "🔄 更新中..." : "🔄 更新"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            <p className="font-medium">エラー:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <AuthStatus
              authStatus={authStatus}
              onAuthUpdate={loadInitialData}
            />
          </div>
          <div className="lg:col-span-3">
            <TaskDashboard
              tasks={tasks}
              loading={loading}
              onRefresh={refreshTasks}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
