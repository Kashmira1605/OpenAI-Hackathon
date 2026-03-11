"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthSync({
  serverAuthenticated
}: {
  serverAuthenticated: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const syncSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      if (serverAuthenticated) {
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

      if (response.ok) {
        router.refresh();
      }
    };

    void syncSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.refresh();
        return;
      }

      void fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token
        })
      }).then(() => {
        router.refresh();
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, serverAuthenticated]);

  return null;
}
