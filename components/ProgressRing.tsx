export function ProgressRing({
  value,
  label,
  sublabel
}: {
  value: number;
  label: string;
  sublabel: string;
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="rounded-4xl border border-black/5 bg-cream p-5 text-center shadow-card">
      <svg viewBox="0 0 120 120" className="mx-auto h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="#E9E1D3" strokeWidth="12" fill="transparent" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#C65D27"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-20 text-3xl font-semibold text-ink">{value}%</div>
      <p className="mt-10 text-base font-semibold">{label}</p>
      <p className="text-sm text-black/55">{sublabel}</p>
    </div>
  );
}
