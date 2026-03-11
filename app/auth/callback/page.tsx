import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const code = getSingle(params.code);
  const next = getSingle(params.next) || "/dashboard";
  const errorDescription = getSingle(params.error_description);
  const errorCode = getSingle(params.error);

  if (errorCode || errorDescription) {
    redirect(`/auth?error=${encodeURIComponent(errorDescription || errorCode || "Authentication failed.")}`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth?error=Supabase%20is%20not%20configured.");
  }

  if (!code) {
    redirect("/auth?error=Missing%20auth%20code.");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
