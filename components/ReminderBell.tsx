"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Clock3 } from "lucide-react";

type ReminderBellProps = {
  courseTitle: string;
  targetLabel?: string;
};

export function ReminderBell({ courseTitle, targetLabel }: ReminderBellProps) {
  const [minutes, setMinutes] = useState(10);
  const [status, setStatus] = useState("No reminder armed.");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!deadline) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  const remainingLabel = useMemo(() => {
    if (!deadline) {
      return null;
    }

    const seconds = Math.max(0, Math.round((deadline - now) / 1000));
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");

    return `${min}:${sec}`;
  }, [deadline, now]);

  const playAlarm = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAA////AAAA////AAAA////AAAA////AAAA////"
    );
    void audio.play().catch(() => undefined);
  };

  const armReminder = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const target = Date.now() + minutes * 60 * 1000;
    setNow(Date.now());
    setDeadline(target);
    setStatus(`Reminder armed for ${minutes} minute${minutes === 1 ? "" : "s"} from now.`);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      playAlarm();

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Study Quest reminder", {
          body: `Time to come back to ${courseTitle}. Start the next small task now.`
        });
      }

      window.alert(`Time to come back to ${courseTitle}. Start the next small task now.`);
      setStatus(`Reminder fired for ${courseTitle}.`);
      setDeadline(null);
      timeoutRef.current = null;
    }, minutes * 60 * 1000);
  };

  return (
    <div className="grid gap-4 rounded-[1.5rem] bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
        <BellRing className="h-4 w-4 text-ember" />
        In-app reminder
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-ink">Nudge me back</h3>
        <p className="mt-2 text-sm leading-6 text-black/60">
        Use this when you want a short break without fully disappearing. It can trigger a browser notification and an in-app alarm while the app is open.
        </p>
      </div>
      {targetLabel ? (
        <div className="rounded-[1.25rem] bg-cream p-4 text-sm text-black/60">
          Current target: <span className="font-semibold text-ink">{targetLabel}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {[5, 10, 20, 30].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMinutes(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              minutes === value ? "bg-ember text-white" : "bg-sand text-black/70 hover:bg-mist"
            }`}
          >
            {value} min
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={armReminder}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#243127] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1A241C]"
      >
        <Clock3 className="h-4 w-4" />
        Arm reminder
      </button>
      <div className="rounded-[1.25rem] bg-sand p-4">
        <p className="text-sm text-black/60">{status}</p>
        {deadline ? <p className="mt-1 text-sm font-semibold text-ink">Countdown: {remainingLabel}</p> : null}
      </div>
    </div>
  );
}
