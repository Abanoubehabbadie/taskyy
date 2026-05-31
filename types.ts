export type TaskStatus = "pending" | "in-progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  priority: TaskPriority;
  senderName: string;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type NotificationKind =
  | "task-sent"
  | "task-received"
  | "task-started"
  | "task-completed";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  taskId: string;
  createdAt: number;
  read: boolean;
}

export type Role = "sender" | "receiver";

// Events that travel across tabs via BroadcastChannel
export interface ChannelEvent {
  type: NotificationKind;
  task: Task;
  at: number;
}
