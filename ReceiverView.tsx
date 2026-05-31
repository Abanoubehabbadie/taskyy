import { useTasks } from "../context/TaskContext";
import type { Task, TaskStatus } from "../types";
import { formatTime } from "../utils/format";
import { cn } from "../utils/cn";

export function ReceiverView() {
  const { tasks, updateTaskStatus, deleteTask } = useTasks();

  const sorted = [...tasks].sort((a, b) => {
    const rank: Record<TaskStatus, number> = {
      pending: 0,
      "in-progress": 1,
      completed: 2,
    };
    if (rank[a.status] !== rank[b.status])
      return rank[a.status] - rank[b.status];
    return a.order - b.order;
  });

  const counts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    active: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="space-y-4">
      {/* Responses header card */}
      <div className="gf-card-header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-['Google_Sans',Roboto,sans-serif] text-2xl font-normal text-[var(--gf-text)]">
              Responses
            </h1>
            <p className="mt-2 text-sm text-[var(--gf-muted)]">
              Tasks sent to you. Update status to notify the sender.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-[var(--gf-border)] bg-white px-3 py-1.5">
              <span className="text-2xl leading-none">📊</span>
              <span className="font-['Google_Sans',Roboto,sans-serif] text-xl font-normal text-[var(--gf-text)]">
                {counts.total}
              </span>
            </div>
          </div>
        </div>

        {counts.total > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Chip label="Pending" count={counts.pending} tone="amber" />
            <Chip label="In progress" count={counts.active} tone="sky" />
            <Chip label="Completed" count={counts.done} tone="green" />
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="gf-card py-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gf-purple-light)] text-2xl">
            📭
          </div>
          <h3 className="font-['Google_Sans',Roboto,sans-serif] text-lg font-normal text-[var(--gf-text)]">
            No responses yet
          </h3>
          <p className="mt-1 text-sm text-[var(--gf-muted)]">
            When someone submits a task, it will appear here.
          </p>
        </div>
      ) : (
        sorted.map((t) => (
          <ResponseCard
            key={t.id}
            task={t}
            onStatusChange={(s) => updateTaskStatus(t.id, s)}
            onDelete={() => deleteTask(t.id)}
          />
        ))
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "amber" | "sky" | "green";
}) {
  const colors = {
    amber: "bg-amber-100 text-amber-800",
    sky: "bg-sky-100 text-sky-800",
    green: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        colors[tone]
      )}
    >
      {label}: {count}
    </span>
  );
}

function ResponseCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (s: TaskStatus) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "gf-card",
        task.status === "completed" && "opacity-70"
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[var(--gf-border)] pb-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-[var(--gf-purple-light)] px-2 py-0.5 text-xs font-semibold text-[var(--gf-purple)]">
            Response #{task.order}
          </span>
          <StatusPill status={task.status} />
          <PriorityPill priority={task.priority} />
        </div>
        <button
          onClick={onDelete}
          title="Delete"
          className="rounded-full p-1.5 text-[var(--gf-muted)] transition hover:bg-gray-100"
        >
          🗑
        </button>
      </div>

      {/* Response fields — shown like Google Forms response view */}
      <ResponseField label="Task title" value={task.title} />
      {task.description && (
        <ResponseField label="Description" value={task.description} />
      )}
      <ResponseField label="From" value={task.senderName || "Anonymous"} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--gf-muted)]">
        <span>Submitted {formatTime(task.createdAt)}</span>
        {task.completedAt && (
          <>
            <span>·</span>
            <span className="text-green-700">
              Completed {formatTime(task.completedAt)}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--gf-border)] pt-4">
        {task.status !== "in-progress" && (
          <button
            onClick={() => onStatusChange("in-progress")}
            className="gf-btn-text text-xs"
          >
            🚀 Start
          </button>
        )}
        {task.status !== "completed" && (
          <button
            onClick={() => onStatusChange("completed")}
            className="gf-btn-primary text-xs"
          >
            ✓ Mark completed
          </button>
        )}
        {task.status !== "pending" && (
          <button
            onClick={() => onStatusChange("pending")}
            className="gf-btn-text text-xs"
          >
            ↺ Reset to pending
          </button>
        )}
      </div>
    </div>
  );
}

function ResponseField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-[var(--gf-muted)]">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-[15px] text-[var(--gf-text)]">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    "in-progress": "bg-sky-100 text-sky-800",
    completed: "bg-green-100 text-green-800",
  };
  const label: Record<TaskStatus, string> = {
    pending: "Pending",
    "in-progress": "In progress",
    completed: "Completed",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        map[status]
      )}
    >
      {label[status]}
    </span>
  );
}

function PriorityPill({ priority }: { priority: Task["priority"] }) {
  const map: Record<Task["priority"], string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        map[priority]
      )}
    >
      {priority}
    </span>
  );
}
