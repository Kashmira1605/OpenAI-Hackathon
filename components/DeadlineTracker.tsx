"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardCheck, Trash2 } from "lucide-react";

export type TrackedDeadline = {
  id: string;
  title: string;
  kind: "assignment" | "exam";
  dueDate: string;
  estimatedMinutes: number;
  completed: boolean;
};

function storageKey(courseId: string) {
  return `study-quest-deadlines-${courseId}`;
}

export function readTrackedDeadlines(courseId: string): TrackedDeadline[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(courseId));

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as TrackedDeadline[];
  } catch {
    window.localStorage.removeItem(storageKey(courseId));
    return [];
  }
}

function writeTrackedDeadlines(courseId: string, deadlines: TrackedDeadline[]) {
  window.localStorage.setItem(storageKey(courseId), JSON.stringify(deadlines));
}

export function DeadlineTracker({
  courseId,
  onDeadlinesChange
}: {
  courseId: string;
  onDeadlinesChange?: (deadlines: TrackedDeadline[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TrackedDeadline["kind"]>("assignment");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [deadlines, setDeadlines] = useState<TrackedDeadline[]>([]);

  useEffect(() => {
    const stored = readTrackedDeadlines(courseId);
    setDeadlines(stored);
    onDeadlinesChange?.(stored);
  }, [courseId, onDeadlinesChange]);

  const persist = (next: TrackedDeadline[]) => {
    setDeadlines(next);
    writeTrackedDeadlines(courseId, next);
    onDeadlinesChange?.(next);
  };

  const addDeadline = () => {
    if (!title.trim() || !dueDate) {
      return;
    }

    const next = [
      {
        id: `${kind}-${Date.now()}`,
        title: title.trim(),
        kind,
        dueDate,
        estimatedMinutes,
        completed: false
      },
      ...deadlines
    ].sort((left, right) => left.dueDate.localeCompare(right.dueDate));

    persist(next);
    setTitle("");
    setDueDate("");
    setEstimatedMinutes(25);
    setKind("assignment");
  };

  const toggleComplete = (id: string) => {
    persist(
      deadlines.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed
            }
          : item
      )
    );
  };

  const removeDeadline = (id: string) => {
    persist(deadlines.filter((item) => item.id !== id));
  };

  const openDeadlines = useMemo(() => deadlines.filter((item) => !item.completed), [deadlines]);

  return (
    <div className="grid gap-4 rounded-[1.5rem] bg-white p-5 shadow-card">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
          <CalendarDays className="h-4 w-4 text-ember" />
          Deadlines
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-ink">Assignments and exams</h3>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Add every assignment and exam for this class. The planner will use the next open one as the active target.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as TrackedDeadline["kind"])}
            className="rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none"
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Chapter 4 problem set"
            className="rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[0.9fr_0.7fr_0.4fr]">
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none"
          />
          <input
            type="number"
            min={5}
            step={5}
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
            className="rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={addDeadline}
            className="rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {openDeadlines.length === 0 ? (
          <div className="rounded-[1.25rem] bg-cream p-4 text-sm text-black/60">
            No deadlines yet. Add assignments and exams here so the class planner can work from real targets.
          </div>
        ) : (
          openDeadlines.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-cream p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{item.kind}</div>
                <div className="mt-1 font-semibold text-ink">{item.title}</div>
                <div className="mt-1 text-sm text-black/60">
                  Due {item.dueDate} · {item.estimatedMinutes} min expected
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleComplete(item.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-black/70"
                >
                  <CheckCircle2 className="h-4 w-4 text-olive" />
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => removeDeadline(item.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-black/55"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deadlines.some((item) => item.completed) ? (
        <div className="rounded-[1.25rem] bg-sand p-4 text-sm text-black/65">
          <div className="inline-flex items-center gap-2 font-semibold text-black/70">
            <ClipboardCheck className="h-4 w-4 text-ember" />
            Completed
          </div>
          <div className="mt-2">{deadlines.filter((item) => item.completed).length} deadline items marked complete.</div>
        </div>
      ) : null}
    </div>
  );
}
