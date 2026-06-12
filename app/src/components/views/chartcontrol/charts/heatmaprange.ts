// Dynamic x-range for the calendar heatmap.
//
// The heatmap plots one column per simulation day across hours of the day.
// The x-domain used to be hard-coded to a full calendar year ([0, 365]) and
// columns were positioned by EnergyPlus's `SimulationDays`. Two problems:
//
//   1. Any run shorter than a year (design-day sizing runs especially)
//      collapsed into a thin sliver on the left edge.
//   2. `SimulationDays` resets to 1 within each environment, so a run with
//      multiple design days (e.g. a December heating day + an August cooling
//      day) gave every design day the same value — they stacked on one column.
//
// This derives the domain and column assignment from the distinct calendar
// days actually present, in chronological order, so a 2-design-day run shows
// two side-by-side columns that fill the plot, and an annual run is unchanged
// (365 columns, one per day).

const MONTHS: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec'
};

interface DayRow {
  year: number;
  month: number;
  day: number;
}

export interface HeatmapTick {
  pos: number; // column index (left edge of the cell)
  label: string;
}

export interface HeatmapXConfig {
  numDays: number; // number of distinct calendar-day columns (>= 1)
  column: (d: DayRow) => number; // 0-based column index for a datum
  ticks: HeatmapTick[]; // one tick per month present, chronological
}

// Sortable integer key for a calendar day (handles multi-year run periods).
const dayKey = (d: DayRow) => d.year * 10000 + d.month * 100 + d.day;

export function heatmapXConfig(series: DayRow[]): HeatmapXConfig {
  const seen = new Map<number, DayRow>();
  for (const d of series) {
    const k = dayKey(d);
    if (!seen.has(k)) seen.set(k, d);
  }

  const days = [...seen.values()].sort((a, b) => dayKey(a) - dayKey(b));
  const numDays = Math.max(days.length, 1);

  const colIndex = new Map<number, number>();
  days.forEach((d, i) => colIndex.set(dayKey(d), i));
  const column = (d: DayRow) => colIndex.get(dayKey(d)) ?? 0;

  const ticks: HeatmapTick[] = [];
  let lastMonth: number | null = null;
  days.forEach((d, i) => {
    if (d.month !== lastMonth) {
      ticks.push({ pos: i, label: MONTHS[d.month] });
      lastMonth = d.month;
    }
  });

  return { numDays, column, ticks };
}
