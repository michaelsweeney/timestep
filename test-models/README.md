# test-models

Local EnergyPlus models and outputs used for manual testing and the vitest
fixtures. **Nothing in this directory is tracked except this README** — all
model folders are gitignored, regeneratable, and live only on your machine.

## Layout & naming

One model per folder, named `<size>-<building>[-<city>][-<what-it-tests>]`,
lowercase kebab. Examples:

- `small-office-seattle/` — prototype tabular/SQL reference outputs
- `large-office-multifreq/` — annual run with curated variables across four
  reporting frequencies (Zone Timestep / Hourly / Daily / Monthly); the
  vitest multi-frequency ESO/SQL fixture
- `large-office-design-day/` — design-day-only run; vitest bnd/summary fixture
- `large-hotel-no-sql/` — (example) large model run without `Output:SQLite`

Keep original EnergyPlus filenames inside the folder (`eplusout.sql`,
`<Model>.table.htm`, …) — the folder name carries the identity.

## Regenerating

The matrix harness generates condition-matrix runs into `test-matrix/`
(also gitignored) and can repopulate fixtures here:

```bash
node scripts/eplus-matrix.mjs --list          # see available models/variants
node scripts/eplus-matrix.mjs                 # run the full matrix
node scripts/eplus-matrix.mjs --only large-office-multifreq
```

The two vitest fixture folders (`large-office-multifreq/`,
`large-office-design-day/`) are produced by the harness entries of the same
name; tests skip gracefully when they're absent.

## Sources (machine-local)

| What | Default path | Override |
|------|--------------|----------|
| EnergyPlus installs (22.1–25.2) | `~/programs/energyplus/` | `EPLUS_ROOT` |
| PNNL ASHRAE 90.1 prototype IDFs (v22.1) | `~/Documents/energyplus-files/pnnl-commercial-prototypes/` | `EPLUS_PROTOTYPES` |
| Prototype weather files | `~/Documents/energyplus-files/eplus-weather/` | `EPLUS_WEATHER` |

Prototype IDFs are `Version 22.1` — run them with the 22.1 engine (the
harness picks the engine by parsing the IDF's `Version` object). Stock
prototypes do **not** include `Output:SQLite`; the harness adds it for
`*-sqlite` variants.

## Migrating from the legacy flat layout

If your checkout still has loose `ASHRAE901_*.{sql,table.htm}` pairs and
`eso-test/{annual,design-day}`:

```bash
cd test-models \
  && for f in ASHRAE901_*.table.htm; do
       b=${f%.table.htm}; core=${b#ASHRAE901_}
       model=${core%%_STD2022_*}; city=${core##*_STD2022_}
       case $model in
         ApartmentMidRise) m=midrise-apartment;; Hospital) m=hospital;;
         HotelLarge) m=large-hotel;; HotelSmall) m=small-hotel;;
         OfficeLarge) m=large-office;; OfficeSmall) m=small-office;;
       esac
       c=$(echo "$city" | sed 's/\([a-z]\)\([A-Z]\)/\1-\2/g' | tr 'A-Z' 'a-z')
       mkdir -p "$m-$c" && mv "$f" "$b.sql" "$m-$c/" 2>/dev/null
     done \
  && mkdir -p large-office-multifreq large-office-design-day \
  && mv eso-test/annual/* large-office-multifreq/ \
  && mv eso-test/design-day/* large-office-design-day/ \
  && rmdir -p eso-test/annual eso-test/design-day 2>/dev/null
```
