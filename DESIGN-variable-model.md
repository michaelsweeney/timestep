# Design Note — Variable Identity & Unit Resolution

Status: **draft / for review** · Scope: `@timestep/core` ingestion + query layer ·
Audience: maintainers · Prompted by: the `null:` meter label surfaced while
building the browser port (the renderer is identical across desktop/web, so
every finding here applies to **both** builds — none of this is web-specific).

This is an audit-before-patch pass. It documents how Timestep decides *what a
series is* and *what units it's in*, where that model breaks against real
EnergyPlus output, and a sequenced plan. The pieces interlock (meters, KeyValue
semantics, BND fluid resolution, ESO↔SQL parity), so the intent is to agree the
target model before touching code.

---

## 1. How it works today

Two ingestion paths converge on one query layer:

```
.sql  ──────────────────────────────┐
                                     ├─►  ReportDataDictionary / ReportData / Time
.eso ─► parseEso ─► esoToSqlite ─────┘            │
                                                  ▼
                       getAllSeries / getSeriesIndex  ──(reads sibling .bnd)──►  series list + IP/SI units
                                                  │
                                                  ▼
                                            getSeries  ──►  plotted values
```

**Variable identity** is `${KeyValue}: ${Name} (${units}) - ${ReportingFrequency}`,
assembled in `getAllSeries` (the list) and again, verbatim, in `getSeriesIndex`
(the plotted series). The dictionary row is the source of truth: `KeyValue`,
`Name`, `Units`, `ReportingFrequency`, `Type`, `TimestepType`, `IsMeter`.

**Unit resolution** (SI → IP): non-`m3/s` units map through `unitdict` /
`unitconvert` (`conversions.ts`). `m3/s` is special-cased — it reads the sibling
`.bnd`, looks up `bnd_dict[KeyValue]` for the node's fluid type, and labels
`Air → cfm`, `Water → gpm`, anything else → `cfm`. `readBnd` builds
`{ nodeName: fluidType }` from the `.bnd` `<#Nodes>` block:

```
! <Node>,<NodeNumber>,<Node Name>,<Node Fluid Type>,<# Times Node Referenced…>
 Node,29,HEATSYS1 SUPPLY INLET NODE,Water,3
 Node,1,VAV_BOT WITH REHEAT_OAINLET NODE,Air,4
```

(`linesplit[2]` = node name, `linesplit[3]` = fluid type. Confirmed against the
large-office fixture: 193 Air / 164 Water nodes.)

---

## 2. Findings

Ordered by impact. Severity = how wrong the user-visible result is; each is
evidenced against the in-repo fixtures.

### F1 — ESO ingestion silently drops every meter  ·  **high**

A `.eso` meter dictionary line has no key field:

```
65,1,Electricity:Facility [J] !Hourly          ← meter:    id,nitems,<Name [units] !freq>
7,1,Environment,Site Outdoor Air Drybulb… [C] !Hourly   ← variable: id,nitems,<Key>,<Name…>
```

`parseDictionaryLine` (`parseeso.ts`) slices `KeyValue` off at the first comma of
the remainder and `return null`s when there's no further comma. A meter line has
no comma after the name → **dropped**. Verified on the multifreq fixture: lines
71–72 (`Electricity:Facility`, `NaturalGas:Facility`) do not survive conversion;
the native `.sql` sibling carries them (`IsMeter=1, KeyValue=NULL`).

Known-but-unhandled: `esoparity.test.ts` scopes its volume check to
*"non-meter variables"* — meters were fenced out of the parity guarantee on
purpose.

Impact: an `Output:SQLite` user is unaffected, but the whole point of the v2 ESO
feature is reading a raw `.eso` — and that path loses EUI, utility totals, and
all end-use meters (`InteriorLights:Electricity`, `Heating:NaturalGas`, …). If
the IDF used `Output:Meter:MeterFileOnly`, the meters live in `.mtr`, which
Timestep doesn't read at all.

### F2 — ESO conversion discards `Type` / `IsMeter` / `IndexGroup`  ·  **medium**

`esoToSqlite`'s dictionary insert hard-codes `IsMeter=0`, `Type=''`,
`IndexGroup=''`, `TimestepType=''`. So even setting meters aside, ESO-sourced
files lose the variable **Type** (`Sum` vs `Avg`) that the native `.sql` carries.
`getSeries` reads `series_obj.Type` into `data.type`; on ESO files it's always
empty. Anywhere aggregation/rollup depends on Sum-vs-Avg, ESO and SQL diverge.

### F3 — `m3/s` resolution is node-name-keyed, so non-node flows mislabel  ·  **medium**

`bnd_dict[KeyValue]` only resolves when `KeyValue` is a node name (the
`System Node … Volume Flow Rate` family). Any `m3/s` variable whose key isn't a
BND node — water-use equipment flows, plant/zone-level volume flows — falls
through to the **cfm default**. That's an air-biased guess; water-side non-node
flows that should read **gpm** render cfm (a real magnitude error, since the
cfm/gpm factors differ). Not yet enumerated against a fixture that outputs such
variables — see Open Questions — but wrong by construction.

### F4 — BND parse is positional/whitespace-fragile and Air/Water-only  ·  **low–medium**

`readBnd` matches `linesplit[0] === ' Node'` (leading space) and trusts column 3.
Correct for the `<#Nodes>` block in the fixtures, but brittle to formatting, and
it only understands `Air`/`Water` — `Steam` and blank fluid types collapse to
cfm. No guard that the matched line is actually in the `<#Nodes>` section.

### F5 — `unitconvert` gaps produce silently-wrong IP labels  ·  **medium**

`conversions.ts` carries literal `'tbd'` for several SI units (`J_kg`, `kg_m3`,
`m3_kg`, `kg_m_s`, `N_s_m2`). When hit, `value * 'tbd'` → `NaN` → `getSeries`
keeps the **SI magnitude** but `getAllSeries`/`getSeriesIndex` still show the
**IP label** from `unitdict` — i.e. an IP unit with an unconverted SI number.
Units absent from the dict entirely fall back to displaying SI. Either way the
label can assert a conversion that didn't happen.

### F6 — SCFM vs ACFM conflated  ·  **low**

`Standard Density Volume Flow Rate` and `Volume Flow Rate` are both `m3/s` and
both render plain "cfm," dropping the standard-vs-actual-density distinction that
matters to mechanical reviewers.

### F7 — Resolution logic duplicated  ·  **low (maintenance)**

The full `m3/s`/BND block is copy-pasted in `getAllSeries` and `getSeriesIndex`.
They currently agree (both re-read the `.bnd`), but any fix must touch both, and
drift between "the list" and "the plotted series" is a latent failure mode.

### F8 — `null:` meter label  ·  **cosmetic**

Native `.sql` stores `KeyValue = NULL` for meters; the label
`${KeyValue}: ${Name}` renders `null: Electricity:Facility` on **both** builds.
Symptom that opened this audit, not a defect on its own.

---

## 3. Target model

Principles to design toward:

1. **ESO↔SQL parity is the contract, meters included.** A `.eso`-sourced file
   should answer every query — dictionary, units, values — identically to its
   native `.sql`. Parity tests should *assert* meters survive, not exclude them.
2. **Identity is typed, not string-keyed guesswork.** A series is
   `{ keyValue|null, name, units, frequency, type, isMeter }`. Meters are
   `isMeter=true, keyValue=null` and label as just `Name` (no `null:` prefix).
3. **Unit resolution is explicit about what it knows.** Never show an IP label
   for a conversion that didn't run. Unknown/`tbd` → show SI honestly (or a
   flagged state), don't assert a false unit.
4. **Fluid resolution degrades in a known direction and says so.** Node-keyed
   when possible; documented fallback when the key isn't a node; never a silent
   air bias on water flows without a reason.
5. **One resolver.** A single `resolveUnits(row, bnd)` used by every consumer.

---

## 4. Proposed plan (sequenced)

**P0 — ESO meter recovery (closes F1, most of F8).**
Teach `parseDictionaryLine` the keyless meter form: if the post-`id,nitems`
remainder matches `…[units] !freq` with no comma before `[`, it's a meter —
`keyValue = null`, `name =` the text before `[units]`, tag `isMeter`. Carry
`isMeter` through `esoToSqlite` (`IsMeter=1`, `KeyValue=NULL`) so converted files
match native. Label meters as `Name` only.
*Test:* extend `esoparity.test.ts` to include meters — assert the meter
dictionary row and a meter series join match native `.sql` row-for-row. (This
test currently exists but is scoped to non-meters; widening it is the guard.)

**P1 — Honest units + single resolver (closes F5, F7; frames F3/F6).**
Extract one `resolveUnits(row, bnd)`; replace the duplicated blocks. Make the
`tbd`/missing path return an explicit "no IP conversion" state so the label can't
claim a unit it didn't compute. Fill the achievable `tbd` factors.
*Test:* table-driven unit-resolution cases (extends the fixture-free
`getallseries.test.ts` fake-engine pattern), incl. every `tbd` unit and an
unknown unit.

**P2 — Fluid resolution robustness (closes F3, F4, F6).**
Harden `readBnd` (section-scoped, fluid vocab beyond Air/Water). Decide the
non-node `m3/s` policy (P2 needs the Open Questions answered first). Optionally
split SCFM/ACFM by variable name.
*Test:* BND fixtures exercising Water/Air/Steam/blank and a non-node `m3/s` key.

**P2.5 — `Type`/`IsMeter` fidelity (closes F2).**
Populate `Type` in ESO conversion. ESO doesn't label Avg/Sum directly; derive
from variable semantics or accept a known gap and document it.

---

## 5. Open questions

Resolvable by checking (I can just do these):
- Which output objects in representative IDFs emit **non-node `m3/s`** variables,
  and what their `KeyValue` looks like — to set the F3 fallback policy on
  evidence. (The current fixtures that output `m3/s` are node flows; need one
  with water-use / plant volume flows.)
- The real **fluid-type vocabulary** in your `.bnd` files beyond Air/Water.
- Whether meters typically land in your `.eso` or only `.mtr` in practice —
  decides whether P0 alone is enough or we also ingest `.mtr`.

Needs your call:
- **`.mtr` ingestion** — P0 recovers meters *embedded* in the `.eso`;
  `MeterFileOnly` setups still need a `.mtr` reader (shares the ESO format —
  modest, but new file plumbing through the `Engine`).
- **Unit completeness vs. just-stop-lying** — chase full IP coverage, or only
  guarantee we never show a false IP label?
- **SCFM/ACFM** — worth splitting, or is plain cfm acceptable for your users?
- **Avg/Sum on ESO** — derive it, or document the gap?

---

## 6. Non-goals

Not touching the chart/render layer, the Engine/IPC/sql.js boundary, or the
on-disk SQLite schema (the native E+ subset stays the contract). This is purely
the dictionary→identity→units derivation inside `@timestep/core`.
