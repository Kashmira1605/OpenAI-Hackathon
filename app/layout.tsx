import type { Metadata } from "next";
import Link from "next/link";

import { AuthSync } from "@/components/AuthSync";
import { AuthStatus } from "@/components/AuthStatus";
import { MoodThemePicker } from "@/components/MoodThemePicker";
import { getAppState } from "@/lib/data";

import "./globals.css";

export const metadata: Metadata = {
  title: "Study Quest",
  description:
    "A gamified ADHD study companion that converts class materials into small, playable study paths."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await getAppState();

  return (
    <html lang="en">
      <body>
        <AuthSync serverAuthenticated={Boolean(state.authUser)} />
        <div className="mood-shell mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mood-panel mb-8 flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-white/70 px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="text-2xl font-semibold tracking-tight text-ink">
              Study Quest
            </Link>
            <div className="flex flex-col gap-3 sm:items-end">
              <MoodThemePicker />
              <nav className="flex flex-wrap gap-2 text-sm font-medium text-black/60">
                <Link className="rounded-full px-3 py-2 transition hover:bg-sand hover:text-ink" href="/dashboard">
                  Dashboard
                </Link>
                <Link
                  className="rounded-full px-3 py-2 transition hover:bg-sand hover:text-ink"
                  href={`/semester/${state.currentSemester.id}`}
                >
                  Semester
                </Link>
                <Link className="rounded-full px-3 py-2 transition hover:bg-sand hover:text-ink" href="/rewards">
                  Rewards
                </Link>
              </nav>
              <AuthStatus email={state.authUser?.email} isAuthenticated={Boolean(state.authUser)} />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
