"use client";

type Series = { key: string; label: string; color: string; dash?: boolean };

export function AccessibleLineChart({
  title,
  data,
  series
}: {
  title: string;
  data: Array<{ date: string } & Record<string, string | number>>;
  series: Series[];
}) {
  const width = 640;
  const height = 220;
  const padding = 28;
  const max = Math.max(1, ...data.flatMap((point) => series.map((item) => Number(point[item.key] ?? 0))));
  const points = (key: string) => data.map((point, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - (Number(point[key] ?? 0) / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  const totals = series.map((item) => ({
    ...item,
    total: data.reduce((sum, point) => sum + Number(point[item.key] ?? 0), 0)
  }));

  return (
    <figure aria-label={title}>
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
        {totals.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.key}>
            <span className="h-1 w-7 rounded" style={{ background: item.color }} />
            {item.label}: {item.total}
          </span>
        ))}
      </div>
      <svg className="mt-4 h-auto w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
        <title>{title}. Maximum daily value {max}.</title>
        {[0, .25, .5, .75, 1].map((ratio) => (
          <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} stroke="#e2e8f0" />
        ))}
        {series.map((item) => (
          <polyline key={item.key} points={points(item.key)} fill="none" stroke={item.color} strokeDasharray={item.dash ? "8 6" : undefined} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        ))}
      </svg>
      <details className="mt-2 text-sm text-slate-600">
        <summary className="cursor-pointer font-bold text-emerald-800">View chart data</summary>
        <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">Date</th>{series.map((item) => <th className="p-2" key={item.key}>{item.label}</th>)}</tr></thead>
            <tbody>{data.map((point) => <tr className="border-t border-slate-100" key={String(point.date)}><td className="p-2">{String(point.date)}</td>{series.map((item) => <td className="p-2" key={item.key}>{String(point[item.key] ?? 0)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function AccessibleBars({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <figure aria-label={title} className="grid gap-3">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold capitalize">{item.label}</span><span>{item.value}</span></div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${["bg-emerald-600", "bg-violet-600", "bg-amber-500"][index % 3]}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </figure>
  );
}
