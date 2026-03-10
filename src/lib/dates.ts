/** Hours shown in the grid (7 AM to 10 PM) */
export const GRID_HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

/**
 * Generate an array of date strings (YYYY-MM-DD) from startDate to endDate inclusive.
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Default date range: today through 3 weeks from today.
 * Returns { startDate, endDate } as YYYY-MM-DD strings.
 */
export function defaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 20); // 3 weeks = 21 days, 0-indexed
  return { startDate: formatDateISO(today), endDate: formatDateISO(end) };
}

/** Format a Date as YYYY-MM-DD */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format a date string as a short label, e.g. "Mon Mar 10" */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Format hour as readable time string, e.g. 9 -> "9 AM", 14 -> "2 PM" */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Group dates by week (Sun–Sat).
 * Returns an array of arrays, each inner array being one week of date strings.
 */
export function groupDatesByWeek(dates: string[]): string[][] {
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  for (const dateStr of dates) {
    const d = new Date(dateStr + "T00:00:00");
    if (currentWeek.length > 0 && d.getDay() === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(dateStr);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
