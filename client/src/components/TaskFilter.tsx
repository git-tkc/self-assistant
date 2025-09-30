import React from "react";

interface TaskFilterProps {
  filter: {
    service: string;
    status: string;
    priority: string;
  };
  sortBy: "priority" | "dueDate" | "created";
  onFilterChange: (filter: any) => void;
  onSortChange: (sortBy: "priority" | "dueDate" | "created") => void;
  taskStats: {
    byService: {
      cybozu: number;
      gmail: number;
      asana: number;
    };
  };
}

const TaskFilter: React.FC<TaskFilterProps> = ({
  filter,
  sortBy,
  onFilterChange,
  onSortChange,
  taskStats,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Service Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">サービス:</label>
          <select
            value={filter.service}
            onChange={(e) =>
              onFilterChange({ ...filter, service: e.target.value })
            }
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">
              全て (
              {taskStats.byService.cybozu +
                taskStats.byService.gmail +
                taskStats.byService.asana}
              )
            </option>
            <option value="cybozu">
              🏢 サイボウズ ({taskStats.byService.cybozu})
            </option>
            <option value="gmail">
              📧 Gmail ({taskStats.byService.gmail})
            </option>
            <option value="asana">
              📊 Asana ({taskStats.byService.asana})
            </option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">
            ステータス:
          </label>
          <select
            value={filter.status}
            onChange={(e) =>
              onFilterChange({ ...filter, status: e.target.value })
            }
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全て</option>
            <option value="open">未完了</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">優先度:</label>
          <select
            value={filter.priority}
            onChange={(e) =>
              onFilterChange({ ...filter, priority: e.target.value })
            }
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全て</option>
            <option value="3">高</option>
            <option value="2">中</option>
            <option value="1">低</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">並び順:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="priority">優先度</option>
            <option value="dueDate">期限日</option>
            <option value="created">作成日</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskFilter;
