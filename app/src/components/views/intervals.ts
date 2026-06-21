export const INTERVALS = [
  'HVAC Timestep',
  'Zone Timestep',
  'Hourly',
  'Daily',
  'Monthly',
  'Run Period'
];

// Decorate an interval option with the count of series available at that
// reporting frequency in the loaded files, e.g. "Hourly [62]". Falls back to
// the bare interval when no counts are known yet (no files loaded).
export function intervalLabel(
  interval: string,
  counts?: Record<string, number>
): string {
  if (!counts || counts[interval] == null) return interval;
  return `${interval} [${counts[interval]}]`;
}
