import { useEffect, useState } from "react";
import type { AppNotification } from "../types";
import { cn } from "../utils/cn";

interface Toast {
  notif: AppNotification;
  exiting: boolean;
}

export function ToastContainer({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const fresh = notifications.filter((n) => !seen.has(n.id));
    if (fresh.length === 0) return;
    setSeen((prev) => {
      const next = new Set(prev);
      fresh.forEach((n) => next.add(n.id));
      return next;
    });
    const newToasts: Toast[] = fresh.slice(0, 3).map((n) => ({
      notif: n,
      exiting: false,
    }));
    setToasts((prev) => [...newToasts, ...prev].slice(0, 4));

    const ids = newToasts.map((t) => t.notif.id);
    const timer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) =>
          ids.includes(t.notif.id) ? { ...t, exiting: true } : t
        )
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => !ids.includes(t.notif.id)));
      }, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notifications, seen]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.notif.id}
          className={cn(
            "pointer-events-auto rounded-md bg-white p-3 text-sm text-[var(--gf-text)] transition-all duration-300",
            "border-l-4",
            kindBorder(t.notif.kind),
            "shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)]",
            t.exiting && "translate-x-8 opacity-0"
          )}
          style={{
            animation: t.exiting ? undefined : "slide-in 0.3s ease-out",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--gf-purple-light)] text-base">
              {kindIcon(t.notif.kind)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-['Google_Sans',Roboto,sans-serif] font-medium">
                {t.notif.title}
              </div>
              <div className="mt-0.5 text-xs text-[var(--gf-muted)]">
                {t.notif.message}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function kindBorder(kind: AppNotification["kind"]) {
  switch (kind) {
    case "task-sent":
      return "border-green-500";
    case "task-received":
      return "border-sky-500";
    case "task-started":
      return "border-amber-500";
    case "task-completed":
      return "border-[var(--gf-purple)]";
  }
}

function kindIcon(kind: AppNotification["kind"]) {
  switch (kind) {
    case "task-sent":
      return "📨";
    case "task-received":
      return "📥";
    case "task-started":
      return "🚀";
    case "task-completed":
      return "🎉";
  }
}
