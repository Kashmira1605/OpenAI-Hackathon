"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
