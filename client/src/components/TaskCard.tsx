import React from "react";
import { Task } from "../types/types";
import { TaskService } from "../services/TaskService";
import { format, isToday, isTomorrow, isPast } from "date-fns";

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);

    if (isToday(date)) {
      return { text: "今日", color: "text-red-600 bg-red-100" };
    }
    if (isTomorrow(date)) {
      return { text: "明日", color: "text-orange-600 bg-orange-100" };
    }
    if (isPast(date)) {
      return {
        text: `期限切れ (${format(date, "M月d日")})`,
        color: "text-red-600 bg-red-100",
      };
    }

    return {
      text: format(date, "yyyy年M月d日"),
      color: "text-gray-600 bg-gray-100",
    };
  };

  const dueInfo = formatDueDate(task.dueDate);
  const serviceIcon = TaskService.getServiceIcon(task.service);
  const serviceColor = TaskService.getServiceColor(task.service);
  const priorityColor = TaskService.getPriorityColor(task.priority);
  const priorityText = TaskService.getPriorityText(task.priority);

  const handleTaskClick = () => {
    if (task.url) {
      window.open(task.url, "_blank");
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-700/30 transition-all duration-300 backdrop-blur-sm ${
        task.url ? "cursor-pointer hover:shadow-lg" : ""
      }`}
      onClick={handleTaskClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Service */}
          <div className="flex items-start space-x-2 mb-2">
            <h3 className="text-sm font-medium text-white truncate flex-1">
              {task.title}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${serviceColor}`}
            >
              {serviceIcon} {task.service.toUpperCase()}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority */}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${priorityColor}`}
            >
              {priorityText}
            </span>

            {/* Status */}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/30">
              {task.status === "open"
                ? "未完了"
                : task.status === "in_progress"
                ? "進行中"
                : task.status === "completed"
                ? "完了"
                : task.status}
            </span>

            {/* Due Date */}
            {dueInfo && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dueInfo.color}`}
              >
                📅 {dueInfo.text}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && task.assignee !== "me" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600">
                👤 {task.assignee}
              </span>
            )}
          </div>
        </div>

        {/* Action indicator */}
        {task.url && (
          <div className="ml-2 flex-shrink-0">
            <div className="text-gray-400 hover:text-blue-400 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
