"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm({
  initialName
}: {
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [semesterName, setSemesterName] = useState("Fall");
  const [year, setYear] = useState(new Date().getFullYear());
  const [courses, setCourses] = useState([
    { title: "", professor: "" },
    { title: "", professor: "" },
    { title: "", professor: "" },
    { title: "", professor: "" }
  ]);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateCourse = (index: number, field: "title" | "professor", value: string) => {
    setCourses((current) => current.map((course, i) => (i === index ? { ...course, [field]: value } : course)));
  };

  const onSubmit = () => {
    startTransition(async () => {
      setStatus(null);

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          semesterName,
          year,
          courses
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus(payload?.error || "Onboarding failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-black/45">Onboarding</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Set up your semester</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
          Add your name, choose the semester, and list the classes you want Study Quest to organize first.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-black/70">
          Your name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            placeholder="Kashmira"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-black/70">
            Semester
            <select
              value={semesterName}
              onChange={(event) => setSemesterName(event.target.value)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            >
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-black/70">
            Year
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        <h2 className="text-2xl font-semibold text-ink">Your classes</h2>
        <div className="grid gap-4">
          {courses.map((course, index) => (
            <div key={index} className="grid gap-3 rounded-[1.5rem] bg-white/70 p-4 lg:grid-cols-[1.3fr_1fr]">
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Class {index + 1}
                <input
                  value={course.title}
                  onChange={(event) => updateCourse(index, "title", event.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  placeholder="Biology 101"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Professor
                <input
                  value={course.professor}
                  onChange={(event) => updateCourse(index, "professor", event.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  placeholder="Dr. Rivera"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !name.trim() || !courses.some((course) => course.title.trim())}
        className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-black/15"
      >
        {isPending ? "Saving..." : "Finish onboarding"}
      </button>

      {status ? <p className="text-sm text-black/60">{status}</p> : null}
    </div>
  );
}
