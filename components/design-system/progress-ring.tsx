export type ProgressRingProps = {
  value: number;
  label: string;
};

export function ProgressRing({ value, label }: ProgressRingProps) {
  const bounded = Math.max(0, Math.min(100, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <div className="inline-grid place-items-center">
      <svg aria-label={label} className="size-28" role="img" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r={radius} stroke="#E2E8F0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={radius}
          stroke="#2563EB"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="-mt-20 text-xl font-black text-text-primary">{bounded}%</span>
    </div>
  );
}
