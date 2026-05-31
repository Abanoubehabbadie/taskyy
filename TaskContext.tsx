import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Task,
  AppNotification,
  ChannelEvent,
  TaskStatus,
} from "../types";

interface TaskContextValue {
  tasks: Task[];
  notifications: AppNotification[];
  addTask: (input: {
    title: string;
    description: string;
    priority: Task["priority"];
    senderName: string;
  }) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const TaskContext = createContext<TaskContextValue | null>(null);

const TASKS_KEY = "taskping.tasks.v1";
const NOTIFS_KEY = "taskping.notifs.v1";
const CHANNEL_NAME = "taskping.channel.v1";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
  );
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage<Task[]>(TASKS_KEY, [])
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage<AppNotification[]>(NOTIFS_KEY, [])
  );

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Persist state
  useEffect(() => {
    saveToStorage(TASKS_KEY, tasks);
  }, [tasks]);
  useEffect(() => {
    saveToStorage(NOTIFS_KEY, notifications);
  }, [notifications]);

  // Cross-tab sync: when another tab changes localStorage, refresh state
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TASKS_KEY && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
      if (e.key === NOTIFS_KEY && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Create broadcast channel for real-time cross-tab events
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (ev: MessageEvent<ChannelEvent>) => {
      const data = ev.data;
      if (!data || !data.type) return;
      // Sync task state from incoming event
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === data.task.id);
        if (idx === -1) {
          // New task arrived
          return [...prev, data.task].sort((a, b) => a.order - b.order);
        }
        const next = [...prev];
        next[idx] = data.task;
        return next.sort((a, b) => a.order - b.order);
      });
      // Translate sender's "task-sent" event into "task-received" for other tabs
      const translated: ChannelEvent =
        data.type === "task-sent"
          ? { ...data, type: "task-received" }
          : data;
      appendNotificationFromEvent(translated);
    };
    return () => ch.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendNotificationFromEvent = useCallback((data: ChannelEvent) => {
    const notif: AppNotification = {
      id: makeId(),
      kind: data.type,
      title: titleFor(data.type, data.task),
      message: messageFor(data.type, data.task),
      taskId: data.task.id,
      createdAt: data.at,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 100));
  }, []);

  const updateTaskStatus: TaskContextValue["updateTaskStatus"] = useCallback(
    (id, status) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const now = Date.now();
        const updated: Task = {
          ...prev[idx],
          status,
          startedAt:
            status === "in-progress" ? prev[idx].startedAt ?? now : prev[idx].startedAt,
          completedAt: status === "completed" ? now : prev[idx].completedAt,
        };
        const next = [...prev];
        next[idx] = updated;

        const kind: ChannelEvent["type"] =
          status === "in-progress"
            ? "task-started"
            : status === "completed"
              ? "task-completed"
              : "task-received";
        channelRef.current?.postMessage({
          type: kind,
          task: updated,
          at: now,
        });
        // Local notification
        const notif: AppNotification = {
          id: makeId(),
          kind,
          title: titleFor(kind, updated),
          message: messageFor(kind, updated),
          taskId: updated.id,
          createdAt: now,
          read: false,
        };
        setNotifications((p) => [notif, ...p].slice(0, 100));
        return next.sort((a, b) => a.order - b.order);
      });
    },
    []
  );

  // Wrapper that also emits a local notification for task-sent
  const addTaskWrapped: TaskContextValue["addTask"] = useCallback(
    (input) => {
      const now = Date.now();
      let createdTask: Task | null = null;
      setTasks((prev) => {
        const maxOrder = prev.reduce((m, t) => Math.max(m, t.order), 0);
        const task: Task = {
          id: makeId(),
          title: input.title,
          description: input.description,
          priority: input.priority,
          senderName: input.senderName || "Anonymous",
          order: maxOrder + 1,
          status: "pending",
          createdAt: now,
        };
        createdTask = task;
        channelRef.current?.postMessage({
          type: "task-sent",
          task,
          at: now,
        });
        return [...prev, task].sort((a, b) => a.order - b.order);
      });
      // Schedule local notification after state update
      queueMicrotask(() => {
        if (createdTask) {
          const notif: AppNotification = {
            id: makeId(),
            kind: "task-sent",
            title: titleFor("task-sent", createdTask),
            message: messageFor("task-sent", createdTask),
            taskId: createdTask.id,
            createdAt: now,
            read: false,
          };
          setNotifications((p) => [notif, ...p].slice(0, 100));
        }
      });
      // Return value isn't used by callers, but keep shape
      return {
        id: "",
        title: input.title,
        description: input.description,
        priority: input.priority,
        senderName: input.senderName,
        order: 0,
        status: "pending",
        createdAt: now,
      };
    },
    []
  );

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        notifications,
        addTask: addTaskWrapped,
        updateTaskStatus,
        deleteTask,
        markAllNotificationsRead,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}

function titleFor(kind: ChannelEvent["type"], task: Task) {
  switch (kind) {
    case "task-sent":
      return `✅ Task sent: ${task.title}`;
    case "task-received":
      return `📥 New task: ${task.title}`;
    case "task-started":
      return `🚀 In progress: ${task.title}`;
    case "task-completed":
      return `🎉 Completed: ${task.title}`;
  }
}

function messageFor(kind: ChannelEvent["type"], task: Task) {
  switch (kind) {
    case "task-sent":
      return `Your task "${task.title}" has been sent to the receiver.`;
    case "task-received":
      return `New task "${task.title}" from ${task.senderName}.`;
    case "task-started":
      return `"${task.title}" is now being worked on.`;
    case "task-completed":
      return `"${task.title}" has been completed by the receiver.`;
  }
}
