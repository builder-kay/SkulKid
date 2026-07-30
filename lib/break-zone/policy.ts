export function isoDurationSeconds(value: string) {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return match ? Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) : 0;
}

export function inWindow(now: Date, item: Record<string, unknown>) {
  const zone = String(item.timezone || "Africa/Accra");
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(now);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const start = String(item.startsAt).slice(0, 5);
  const end = String(item.endsAt).slice(0, 5);
  const scheduledDay = Number(item.dayOfWeek);
  if (start <= end) return scheduledDay === day && time >= start && time <= end;
  return (scheduledDay === day && time >= start) || ((scheduledDay + 1) % 7 === day && time <= end);
}
