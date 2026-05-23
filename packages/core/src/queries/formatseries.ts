// Pure helpers for choosing the right field names off a series row given
// the active unit system (si/ip) and whether multiple files are in play
// (different name field for chart legends).

export function getSeriesKeys(units: string, files: unknown[]) {
  let name_tag = '';
  let val_tag = '';
  let unit_tag = '';
  if (units == 'ip') {
    val_tag = 'value_ip';
    unit_tag = 'units_ip';
    if (files.length == 1) {
      name_tag = 'name_ip_single';
    }
    if (files.length > 1) {
      name_tag = 'name_ip_multi';
    }
  }
  if (units == 'si') {
    val_tag = 'value_si';
    unit_tag = 'units_si';
    if (files.length == 1) {
      name_tag = 'name_si_single';
    }
    if (files.length > 1) {
      name_tag = 'name_si_multi';
    }
  }
  return {
    name: name_tag,
    value: val_tag,
    units: unit_tag
  };
}

export function getSeriesLookupObj(config: {
  array: any[];
  units: string;
  timestepType: string;
  files: unknown[];
}) {
  const { array, units, timestepType, files } = config;
  const { name } = getSeriesKeys(units, files);
  const filtered = array.filter(f => {
    return f.ReportingFrequency == timestepType;
  });
  const seriesLookupObj: Record<string, unknown> = {};
  filtered.forEach(o => {
    const key = o.key;
    seriesLookupObj[o[name]] = key;
  });
  return seriesLookupObj;
}
