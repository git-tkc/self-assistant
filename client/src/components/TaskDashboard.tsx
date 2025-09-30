import React, { useState } from "react";
import { Task } from "../types/types";
import { TaskService } from "../services/TaskService";
import TaskCard from "./TaskCard";
import TaskFilter from "./TaskFilter";

interface TaskDashboardProps {
  tasks: Task[];
  loading: boolean;
  onRefresh: () => void;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  loading,
  onRefresh,
}) => {
  const [filter, setFilter] = useState({
    service: "all",
    status: "all",
    priority: "all",
  });
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "created">(
    "priority"
  );

  const filteredTasks = tasks.filter((task) => {
    if (filter.service !== "all" && task.service !== filter.service)
      return false;
    if (filter.status !== "all" && task.status !== filter.status) return false;
    if (
      filter.priority !== "all" &&
      task.priority !== parseInt(filter.priority)
    )
      return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        if (a.priority !== b.priority) return b.priority - a.priority;
        break;
      case "dueDate":
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        break;
      case "created":
        if (a.createdDate && b.createdDate) {
          return (
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime()
          );
        }
        break;
    }
    return 0;
  });

  const taskStats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    byService: {
      cybozu: tasks.filter((t) => t.service === "cybozu").length,
      gmail: tasks.filter((t) => t.service === "gmail").length,
      asana: tasks.filter((t) => t.service === "asana").length,
    },
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow-xl">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-white">
              {taskStats.total}
            </div>
            <div className="ml-2 text-sm text-gray-300">総タスク数</div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow-xl">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-400">
              {taskStats.open}
            </div>
            <div className="ml-2 text-sm text-gray-300">未完了</div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow-xl">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-yellow-400">
              {taskStats.inProgress}
            </div>
            <div className="ml-2 text-sm text-gray-300">進行中</div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow-xl">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-400">
              {taskStats.completed}
            </div>
            <div className="ml-2 text-sm text-gray-300">完了</div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <TaskFilter
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
        taskStats={taskStats}
      />

      {/* Task List */}
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-medium text-white">
            タスク一覧 ({sortedTasks.length}件)
          </h2>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">📭</div>
            <p className="text-gray-400">
              {tasks.length === 0
                ? "タスクがありません"
                : "フィルター条件に一致するタスクがありません"}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={onRefresh}
                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                タスクを読み込む
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;
