"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "sign-in" | "sign-up";

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("reset") !== "1") {
      return;
    }

    setMode("sign-in");
    setName("");
    setEmail("");
    setPassword("");
    setStatus(null);
  }, [searchParams]);

  const onSubmit = () => {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setStatus("Add your Supabase public keys in .env.local before signing in.");
        return;
      }

      if (!password) {
        setStatus("Enter a password to continue.");
        return;
      }

      if (mode === "sign-up") {
        if (!name.trim()) {
          setStatus("Enter your name to create the account.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
              onboarding_completed: false
            }
          }
        });

        if (error) {
          setStatus(error.message);
          return;
        }

        if (data.session) {
          setStatus("Account created. Redirecting to onboarding.");
          router.push("/onboarding");
          router.refresh();
          return;
        }

        setStatus("Account created. Sign in with your new password to continue.");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      const onboardingCompleted = Boolean(data.user?.user_metadata?.onboarding_completed);
      setStatus(`Signed in. Redirecting to ${onboardingCompleted ? "your dashboard" : "onboarding"}.`);
      router.push(onboardingCompleted ? "/dashboard" : "/onboarding");
      router.refresh();
    });
  };

  return (
    <div className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
      <p className="text-sm uppercase tracking-[0.2em] text-black/45">Supabase auth</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">Sign in to sync your semesters</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-black/60">
        Create an account with your name, then complete onboarding before entering the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: "sign-in", label: "Sign in" },
          { id: "sign-up", label: "Create account" }
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setMode(option.id as AuthMode);
              setStatus(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === option.id ? "bg-ember text-white" : "bg-white text-black/65 hover:bg-sand"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        {mode === "sign-up" ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none sm:col-span-2"
          />
        ) : null}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@school.edu"
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none sm:col-span-1"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !email || !password || (mode === "sign-up" && !name.trim())}
          className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-black/15 sm:col-span-2"
        >
          {isPending ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in with password"}
        </button>
      </div>
      {status ? <p className="mt-4 text-sm text-black/60">{status}</p> : null}
    </div>
  );
}
