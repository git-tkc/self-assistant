export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: number; // 1: low, 2: medium, 3: high
  status: "open" | "in_progress" | "completed";
  assignee?: string;
  createdDate?: string;
  updatedDate?: string;
  url?: string;
  service: "cybozu" | "gmail" | "asana";
}

export interface AuthStatus {
  gmail: boolean;
  asana: boolean;
  cybozu: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  errors?: { service: string; error: string }[] | null;
  totalCount: number;
  lastUpdated: string;
}

export interface ServiceConfig {
  cybozu: {
    enabled: boolean;
    domain: string | null;
  };
  gmail: {
    enabled: boolean;
    clientId: string | null;
  };
  asana: {
    enabled: boolean;
    clientId: string | null;
  };
}

export interface AuthUrls {
  gmail: string;
  asana: string;
}
