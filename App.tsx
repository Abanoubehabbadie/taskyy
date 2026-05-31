import { useEffect, useRef, useState } from "react";
import { TaskProvider, useTasks } from "./context/TaskContext";
import { SenderView } from "./components/SenderView";
import { ReceiverView } from "./components/ReceiverView";
import { ToastContainer } from "./components/ToastContainer";
import {
  useBrowserNotifications,
  useNotificationSound,
} from "./hooks/useNotify";
import { cn } from "./utils/cn";

type Tab = "form" | "responses" | "notifications";

function AppInner() {
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    clearNotifications,
    tasks,
  } = useTasks();
  const [tab, setTab] = useState<Tab>("form");
  const { permission, request, show } = useBrowserNotifications();
  const playSound = useNotificationSound();

  const lastNotifIdRef = useRef<string | null>(null);

  // React to new notifications
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (latest.id === lastNotifIdRef.current) return;
    lastNotifIdRef.current = latest.id;
    playSound(latest.kind);
    show(latest.title, { body: latest.message });
  }, [notifications, playSound, show]);

  return (
    <div className="min-h-screen bg-[var(--gf-bg)]">
      {/* Top app bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--gf-border)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md text-2xl">
            <svg viewBox="0 0 48 48" className="h-8 w-8">
              <path
                fill="#673ab7"
                d="M38 6H10c-2.2 0-4 1.8-4 4v28c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V10c0-2.2-1.8-4-4-4z"
              />
              <path
                fill="#fff"
                d="M16 14h16v2H16zm0 6h16v2H16zm0 6h10v2H16z"
              />
              <circle cx="32" cy="32" r="10" fill="#fff" />
              <path
                fill="#673ab7"
                d="M30 28l5 5-2 2-3-3-1 1-2-2z"
              />
            </svg>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <input
              defaultValue="TaskPing"
              readOnly
              className="w-full truncate bg-transparent font-['Google_Sans',Roboto,sans-serif] text-lg font-medium text-[var(--gf-text)] outline-none"
            />
            <div className="text-xs text-[var(--gf-muted)]">
              Send tasks · Get notified instantly
            </div>
          </div>
          <div className="flex items-center gap-1">
            {permission !== "granted" && permission !== "unsupported" && (
              <button
                onClick={request}
                title="Enable browser notifications"
                className="rounded-full p-2 text-[var(--gf-muted)] transition hover:bg-gray-100"
              >
                🔔
              </button>
            )}
            <button
              onClick={() => {
                setTab("notifications");
                markAllNotificationsRead();
              }}
              title="Notifications"
              className="relative rounded-full p-2 text-[var(--gf-muted)] transition hover:bg-gray-100"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gf-error)] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="sticky top-[60px] z-20 border-b border-[var(--gf-border)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center">
          <TabButton
            active={tab === "form"}
            onClick={() => setTab("form")}
            label="Form"
          />
          <TabButton
            active={tab === "responses"}
            onClick={() => setTab("responses")}
            label={`Responses${tasks.length > 0 ? ` (${tasks.length})` : ""}`}
          />
          <TabButton
            active={tab === "notifications"}
            onClick={() => {
              setTab("notifications");
              markAllNotificationsRead();
            }}
            label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {tab === "form" && <SenderView />}
        {tab === "responses" && <ReceiverView />}
        {tab === "notifications" && (
          <NotificationsView
            onClear={clearNotifications}
            onMarkAllRead={markAllNotificationsRead}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-2 text-center text-xs text-[var(--gf-muted)]">
        <p>
          💡 Tip: open this page in two tabs — keep one on <b>Form</b> and the
          other on <b>Responses</b>, and watch notifications sync live.
        </p>
      </footer>

      <ToastContainer notifications={notifications} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button onClick={onClick} className={cn("gf-tab", active && "active")}>
      {label}
    </button>
  );
}

function NotificationsView({
  onClear,
  onMarkAllRead,
}: {
  onClear: () => void;
  onMarkAllRead: () => void;
}) {
  const { notifications, unreadCount } = useTasks();
  return (
    <div className="space-y-4">
      <div className="gf-card-header">
        <h1 className="font-['Google_Sans',Roboto,sans-serif] text-2xl font-normal text-[var(--gf-text)]">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-muted)]">
          A log of every task event.
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--gf-error)] px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      <div className="gf-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gf-border)] pb-3">
          <div className="text-sm text-[var(--gf-muted)]">
            {notifications.length} event{notifications.length === 1 ? "" : "s"}
          </div>
          <div className="flex gap-1">
            <button
              onClick={onMarkAllRead}
              className="gf-btn-text text-xs"
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
            <button
              onClick={onClear}
              className="gf-btn-text text-xs"
              disabled={notifications.length === 0}
            >
              Clear all
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-4xl">🔕</div>
            <div className="text-sm text-[var(--gf-muted)]">
              No notifications yet.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--gf-border)]">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 py-3",
                  !n.read && "bg-[var(--gf-purple-light)]/40 -mx-3 px-3 rounded"
                )}
              >
                <div className="text-xl">{iconFor(n.kind)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--gf-text)]">
                    {n.title}
                  </div>
                  <div className="text-sm text-[var(--gf-muted)]">
                    {n.message}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--gf-muted)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--gf-purple)]" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function iconFor(kind: string) {
  if (kind === "task-sent") return "📨";
  if (kind === "task-received") return "📥";
  if (kind === "task-started") return "🚀";
  if (kind === "task-completed") return "🎉";
  return "🔔";
}

export default function App() {
  return (
    <TaskProvider>
      <AppInner />
    </TaskProvider>
  );
}
