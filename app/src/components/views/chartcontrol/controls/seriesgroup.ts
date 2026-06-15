// Group an EnergyPlus series picker label by its KeyValue (zone / equipment /
// surface). Labels are built (getAllSeries) as
//   `${KeyValue}: ${Name} (${units}) - ${freq}`   (single file)
//   `${file}, ${KeyValue}: ${Name} (${units}) - ${freq}`   (multi file)
// and meters have NO KeyValue prefix. The first ": " (colon-space) separates
// the key prefix from the variable name; meter names like "Electricity:Facility"
// use a colon WITHOUT a space, so they fall through to the meters group. This
// turns the otherwise-flat alphabetical wall of cryptic identifiers into
// per-zone / per-equipment sections.

export const METERS_GROUP = 'Meters / facility';

export function seriesGroup(label: string): string {
  if (!label) return METERS_GROUP;
  const m = label.match(/^(.*?): /);
  return m ? m[1] : METERS_GROUP;
}

// MUI's Autocomplete renders a new group header every time the group changes in
// option *order*, so the options must be pre-sorted by group or headers repeat.
// Sort by group, then by label within a group; meters sink to the bottom.
export function sortByGroup(options: string[]): string[] {
  return [...options].sort((a, b) => {
    const ga = seriesGroup(a);
    const gb = seriesGroup(b);
    if (ga === gb) return a.localeCompare(b);
    if (ga === METERS_GROUP) return 1;
    if (gb === METERS_GROUP) return -1;
    return ga.localeCompare(gb);
  });
}
