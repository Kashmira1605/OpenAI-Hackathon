"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase browser client is not configured.");
      return;
    }

    const finishSignIn = async () => {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(`Sign-in failed: ${error.message}`);
          return;
        }
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("No Supabase session was created from the email link.");
        return;
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`Session sync failed: ${payload?.error || "unknown error"}`);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    };

    void finishSignIn();
  }, [router, searchParams]);

  return (
    <main className="grid gap-8">
      <section className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
        <p className="text-sm uppercase tracking-[0.2em] text-black/45">Auth callback</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Study Quest sign-in</h1>
        <p className="mt-3 text-sm text-black/60">{message}</p>
      </section>
    </main>
  );
}
