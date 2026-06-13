// Parse an EnergyPlus .rdd (Report Data Dictionary) into a name -> aggregation
// type map ('Avg' | 'Sum'). The .eso itself doesn't carry the Avg/Sum type a
// variable was reported with — the native .sql ReportDataDictionary.Type does —
// but the sibling .rdd lists every available variable with that type in its
// trailing comment:
//
//   Output:Variable,*,Site Outdoor Air Drybulb Temperature,hourly; !- Zone Average [C]
//   Output:Variable,*,Site Precipitation Depth,hourly;             !- Zone Sum [m]
//
// The name (between `,*,` and the next comma) maps 1:1 to its type — a given
// EnergyPlus variable name always has one type — so this is an authoritative
// lookup, not a heuristic. Verified row-for-row against native .sql Type.
//
// Pure (no Node built-ins) — safe to use from the browser build.

export function parseRdd(text: string): Record<string, 'Avg' | 'Sum'> {
  const map: Record<string, 'Avg' | 'Sum'> = {};
  for (const line of text.split('\n')) {
    // Output:Variable,*,<Name>,<freq>; !- <Zone|HVAC|…> <Average|Sum> [units]
    // freq is a single token in practice ([^;,]+ keeps the name capture honest;
    // EnergyPlus variable names contain no commas).
    const m = line.match(
      /^Output:Variable,\*,(.+?),[^;,]+;\s*!-\s*\w+\s+(Average|Sum)\b/
    );
    if (m) map[m[1].trim()] = m[2] === 'Average' ? 'Avg' : 'Sum';
  }
  return map;
}
