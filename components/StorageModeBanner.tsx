export function StorageModeBanner({
  source,
  isAuthenticated
}: {
  source: "mock" | "supabase";
  isAuthenticated: boolean;
}) {
  const message =
    source === "supabase"
      ? "Live mode: this dashboard is reading real semester data from Supabase."
      : isAuthenticated
        ? "Fallback mode: signed in, but Supabase service configuration is incomplete so mock data is still showing."
        : "Demo mode: sign in and configure Supabase to sync your own semesters.";

  return (
    <div className="rounded-[1.5rem] border border-black/5 bg-white/70 px-4 py-3 text-sm text-black/65 shadow-card">
      {message}
    </div>
  );
}
