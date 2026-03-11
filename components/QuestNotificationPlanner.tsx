"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CalendarDays, Sparkles } from "lucide-react";

import { TrackedDeadline } from "@/components/DeadlineTracker";
import { Course } from "@/lib/types";

type DemoPlanItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  minutes: number;
  tone: "today" | "near" | "later";
};

function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function nearestAssessment(course: Course) {
  const today = new Date().toISOString().slice(0, 10);

  return [...course.assessments]
    .filter((item) => item.dueDate >= today)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
}

function deriveTarget(course: Course, deadlines: TrackedDeadline[]) {
  const openDeadline = [...deadlines]
    .filter((item) => !item.completed)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];

  if (openDeadline) {
    return {
      title: openDeadline.title,
      kind: openDeadline.kind,
      dueDate: openDeadline.dueDate,
      topics: course.quests.map((quest) => quest.topic).slice(0, 4)
    };
  }

  const assessment = nearestAssessment(course);
  if (assessment) {
    return {
      title: assessment.title,
      kind: assessment.type,
      dueDate: assessment.dueDate,
      topics: assessment.topics
    };
  }

  return {
    title: `${course.title} demo check-in`,
    kind: "exam",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    topics: course.quests.map((quest) => quest.topic).slice(0, 4)
  };
}

function buildDemoPlan(course: Course, target: ReturnType<typeof deriveTarget>): DemoPlanItem[] {
  const daysLeft = daysUntil(target.dueDate);
  const planLength = Math.min(Math.max(daysLeft, 4), 14);
  const topics = target.topics.length > 0 ? target.topics : course.quests.map((quest) => quest.topic).slice(0, 4);

  return Array.from({ length: planLength }, (_, index) => {
    const topic = topics[index % Math.max(topics.length, 1)] ?? course.title;
    const quest = course.quests[index % Math.max(course.quests.length, 1)] ?? course.quests[0];
    const mission = quest?.missions[index % Math.max(quest?.missions.length ?? 1, 1)] ?? quest?.missions[0];
    const isToday = index === 0;
    const isFinal = index === planLength - 1;
    const label = isToday ? "Today" : index === 1 ? "Tomorrow" : `Day ${index + 1}`;
    const minutes =
      target.kind === "assignment"
        ? isToday
          ? 12
          : isFinal
            ? 18
            : 14
        : isToday
          ? 10
          : daysLeft <= 5
            ? 14
            : 12;

    const title = isFinal
      ? `Confidence run for ${target.title}`
      : target.kind === "assignment"
        ? `Play one ${topic} quest, then finish one small piece of ${target.title}`
        : `Play the ${topic} quest for ${target.title}`;

    const detail = isFinal
      ? "Do one timed quest run and one light recall pass. No cramming beyond the core concepts."
      : mission
        ? `${mission.title}. Keep it to ${minutes} minutes so it feels startable.`
        : `Use one quest run on ${topic}, then stop after the first clean win.`;

    return {
      id: `${course.id}-plan-${index}`,
      label,
      title,
      detail,
      minutes,
      tone: isToday ? "today" : index < 4 ? "near" : "later"
    };
  });
}

export function QuestNotificationPlanner({
  course,
  deadlines
}: {
  course: Course;
  deadlines: TrackedDeadline[];
}) {
  const timeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState("No quest notification armed.");
  const [armedPlanId, setArmedPlanId] = useState<string | null>(null);
  const target = useMemo(() => deriveTarget(course, deadlines), [course, deadlines]);
  const daysLeft = useMemo(() => daysUntil(target.dueDate), [target.dueDate]);
  const plan = useMemo(() => buildDemoPlan(course, target), [course, target]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const armReminder = async (item: DemoPlanItem) => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setArmedPlanId(item.id);
    setStatus(`Demo reminder armed for ${item.label.toLowerCase()}: ${item.title}`);

    timeoutRef.current = window.setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Study Quest daily plan", {
          body: `${item.title} · ${item.minutes} min · Open the quest game for ${course.title}.`
        });
      }

      window.alert(`Study Quest: ${item.title}\n${item.minutes} min\nOpen the ${course.title} quest game now.`);
      setStatus(`Reminder fired: ${item.title}`);
      setArmedPlanId(null);
      timeoutRef.current = null;
    }, 5000);
  };

  return (
    <section className="grid gap-4 rounded-[2rem] border border-black/5 bg-white/80 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            <BellRing className="h-4 w-4 text-ember" />
            Demo notifications
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Daily quest plan until {target.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">
            This MVP demo turns the next {target.kind} into tiny daily quest runs, so an ADHD student always sees the smallest useful study move instead of one giant exam cloud.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-cream px-4 py-3 text-sm text-black/60">
          <div className="font-semibold text-ink">{daysLeft} days until {target.title}</div>
          <div className="mt-1">Reminder demo fires after 5 seconds once armed.</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="grid gap-3">
          <div className="rounded-[1.5rem] bg-[#203128] p-5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <Sparkles className="h-4 w-4 text-[#f3cc74]" />
              What to study next
            </div>
            <div className="mt-3 text-2xl font-semibold">{plan[0]?.title}</div>
            <div className="mt-2 text-sm leading-6 text-white/75">{plan[0]?.detail}</div>
            <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white">
              {plan[0]?.minutes} min quest run
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-cream p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              <CalendarDays className="h-4 w-4 text-ember" />
              Reminder status
            </div>
            <p className="mt-3 text-sm leading-6 text-black/60">{status}</p>
            {plan[0] ? (
              <button
                type="button"
                onClick={() => armReminder(plan[0])}
                className="mt-4 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
              >
                {armedPlanId === plan[0].id ? "Reminder armed" : "Arm today’s quest reminder"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {plan.map((item) => (
            <div
              key={item.id}
              className={`rounded-[1.5rem] p-4 ${
                item.tone === "today"
                  ? "bg-[#203128] text-white"
                  : item.tone === "near"
                    ? "bg-white text-ink"
                    : "bg-cream text-ink"
              }`}
            >
              <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${item.tone === "today" ? "text-white/60" : "text-black/45"}`}>
                {item.label}
              </div>
              <div className="mt-2 text-lg font-semibold">{item.title}</div>
              <div className={`mt-2 text-sm leading-6 ${item.tone === "today" ? "text-white/75" : "text-black/60"}`}>{item.detail}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    item.tone === "today" ? "bg-white/10 text-white" : "bg-sand text-black/70"
                  }`}
                >
                  {item.minutes} min
                </span>
                <button
                  type="button"
                  onClick={() => armReminder(item)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    armedPlanId === item.id
                      ? "bg-ember text-white"
                      : item.tone === "today"
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : "bg-white text-black/65 hover:bg-mist"
                  }`}
                >
                  Notify me
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
