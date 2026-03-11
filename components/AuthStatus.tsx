"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthStatus({
  email,
  isAuthenticated
}: {
  email?: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();

  const onSignOut = async () => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/auth?reset=1");
    router.refresh();
  };

  if (!isAuthenticated) {
    return (
      <Link href="/auth" className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-emberDark">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full bg-sand px-3 py-2 text-sm text-black/65">{email ?? "Signed in"}</div>
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
