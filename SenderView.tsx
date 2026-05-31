import { useState, type FormEvent } from "react";
import { useTasks } from "../context/TaskContext";
import type { TaskPriority } from "../types";
import { formatTime } from "../utils/format";

export function SenderView() {
  const { tasks, addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [senderName, setSenderName] = useState("");
  const [submitted, setSubmitted] = useState<null | {
    title: string;
    priority: TaskPriority;
  }>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      senderName: senderName.trim(),
    });
    setSubmitted({ title: title.trim(), priority });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSenderName("");
  };

  const onClear = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSenderName("");
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="gf-card-header">
          <h1 className="font-['Google_Sans',Roboto,sans-serif] text-2xl font-normal text-[var(--gf-text)]">
            TaskPing
          </h1>
          <p className="mt-2 text-sm text-[var(--gf-muted)]">
            Send tasks and get notified when they're completed.
          </p>
        </div>

        <div className="gf-card text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>
          <h2 className="font-['Google_Sans',Roboto,sans-serif] text-2xl font-normal text-[var(--gf-text)]">
            Your response has been recorded.
          </h2>
          <p className="mt-3 text-sm text-[var(--gf-muted)]">
            You sent <b className="text-[var(--gf-text)]">"{submitted.title}"</b>{" "}
            with <b className="text-[var(--gf-text)]">{submitted.priority}</b>{" "}
            priority. You'll receive a notification when it's completed.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setSubmitted(null)}
              className="gf-btn-primary"
            >
              Submit another response
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-[var(--gf-muted)]">
          This content is neither created nor endorsed by TaskPing. —{" "}
          <a href="#" className="text-[var(--gf-purple)] hover:underline">
            Report Abuse
          </a>{" "}
          —{" "}
          <a href="#" className="text-[var(--gf-purple)] hover:underline">
            Terms of Service
          </a>{" "}
          —{" "}
          <a href="#" className="text-[var(--gf-purple)] hover:underline">
            Privacy Policy
          </a>
        </div>
        <div className="text-center text-xs text-[var(--gf-muted)]">
          <span className="font-['Google_Sans',Roboto,sans-serif]">
            TaskPing
          </span>
        </div>
      </div>
    );
  }

  const myTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Form header card */}
      <div className="gf-card-header">
        <h1 className="font-['Google_Sans',Roboto,sans-serif] text-3xl font-normal text-[var(--gf-text)]">
          TaskPing
        </h1>
        <p className="mt-3 text-sm text-[var(--gf-muted)]">
          Send tasks and get notified when they're completed.
        </p>
        <p className="mt-2 text-[13px] text-[var(--gf-error)]">
          * Indicates required question
        </p>
      </div>

      {/* Question 1: Your name */}
      <QuestionCard label="Your name" hint="How should the receiver address you?">
        <input
          type="text"
          className="gf-input"
          placeholder="Your answer"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        />
      </QuestionCard>

      {/* Question 2: Task title */}
      <QuestionCard label="Task title" required>
        <input
          type="text"
          className="gf-input"
          placeholder="Your answer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </QuestionCard>

      {/* Question 3: Description */}
      <QuestionCard
        label="Description"
        hint="Add details, context, or acceptance criteria."
      >
        <textarea
          className="gf-textarea"
          placeholder="Your answer"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </QuestionCard>

      {/* Question 4: Priority (multiple choice) */}
      <QuestionCard label="Priority" required>
        <div className="space-y-2">
          {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
            <label
              key={p}
              className="flex cursor-pointer items-center gap-3 rounded px-1 py-2 hover:bg-gray-50"
            >
              <input
                type="radio"
                name="priority"
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
                className="gf-radio"
              />
              <span className="text-sm capitalize text-[var(--gf-text)]">
                {p}
              </span>
            </label>
          ))}
        </div>
      </QuestionCard>

      {/* Action row */}
      <div className="gf-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="submit" className="gf-btn-primary">
            Submit
          </button>
          <button type="button" onClick={onClear} className="gf-btn-text">
            Clear form
          </button>
        </div>
        <p className="text-xs text-[var(--gf-muted)]">
          Never submit passwords through TaskPing.
        </p>
      </div>

      {/* Optional: my sent tasks summary */}
      {myTasks.length > 0 && (
        <div className="gf-card">
          <h3 className="mb-3 font-['Google_Sans',Roboto,sans-serif] text-sm font-medium text-[var(--gf-text)]">
            Your recent submissions ({myTasks.length})
          </h3>
          <ul className="divide-y divide-[var(--gf-border)]">
            {myTasks.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--gf-purple-light)] text-[11px] font-semibold text-[var(--gf-purple)]">
                  #{t.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--gf-text)]">
                    {t.title}
                  </div>
                  <div className="text-xs text-[var(--gf-muted)]">
                    {formatTime(t.createdAt)}
                  </div>
                </div>
                <StatusDot status={t.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 text-center text-xs text-[var(--gf-muted)]">
        This content is neither created nor endorsed by TaskPing. —{" "}
        <a href="#" className="text-[var(--gf-purple)] hover:underline">
          Report Abuse
        </a>{" "}
        —{" "}
        <a href="#" className="text-[var(--gf-purple)] hover:underline">
          Terms of Service
        </a>
      </div>
    </form>
  );
}

function QuestionCard({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="gf-card">
      <div className="flex items-start gap-1">
        <label className="flex-1 text-[15px] text-[var(--gf-text)]">
          {label}
          {required && (
            <span className="ml-1 text-[var(--gf-error)]">*</span>
          )}
        </label>
      </div>
      {hint && (
        <p className="mb-2 mt-1 text-xs text-[var(--gf-muted)]">{hint}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-amber-400", label: "Pending" },
    "in-progress": { color: "bg-sky-500", label: "In progress" },
    completed: { color: "bg-green-500", label: "Completed" },
  };
  const m = map[status] ?? map.pending;
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--gf-muted)]">
      <span className={`h-2 w-2 rounded-full ${m.color}`} />
      <span className="hidden sm:inline">{m.label}</span>
    </div>
  );
}
