# What's New in Timestep 2.0

Timestep is a desktop app for looking at EnergyPlus results. You point it at a
simulation's output and it gives you interactive charts of the timeseries —
no SQL, no spreadsheets, no scripting. Version 2.0 is the first update in six
years. Here's what it means for you, in plain terms.

## The short version

- **You can now open `.eso` files directly** — you no longer have to add
  `Output:SQLite` to your IDF and re-run the model.
- **It runs on current Macs, Windows PCs, and Linux again.** The old version had
  stopped installing on modern operating systems.
- **The numbers are checked.** Every release is automatically verified to read
  EnergyPlus output exactly, so you can trust what the charts show.

## Open your `.eso` output directly

This is the headline change.

Before, Timestep could only read the `.sql` database that EnergyPlus writes when
you put `Output:SQLite,SimpleAndTabular;` in your IDF. If you had already run a
model without that line — or you were handed someone else's `.eso` — you had to
go back and re-run the simulation just to look at the results.

Now you can open the raw **`.eso`** file straight from a run. Timestep converts
it to its internal format the first time you open it (you'll see a brief "Loading
files" notification), and **remembers the conversion** so the same file opens
instantly afterward. You can open an `.eso` from the file menu **or just drag it
onto the window**.

What that means day to day: any EnergyPlus run is fair game, including older
results and runs you didn't set up yourself. No re-running models to inspect
them.

It works at every reporting frequency — Timestep handles the common case where
the same variable (say *Site Outdoor Air Drybulb Temperature*) is reported at
Zone Timestep, Hourly, Daily, **and** Monthly all in one run, and keeps each one
separate.

## Once your data is loaded

Loading one or more output files gives you the same exploration tools, now on a
modern, faster foundation:

- **Line charts** of any reported variable over time.
- **Compare multiple simulations** side by side — load several runs and overlay
  the same variable to see how a change moved it.
- **Heatmaps, histograms, scatter plots, and summary statistics** for a quick
  read on distribution, correlation, and magnitude.
- **Search** the variable list by name to find a series fast instead of scrolling.
- **Real-world units.** When a `.bnd` file sits alongside your output, Timestep
  uses it to report air and water flows in **cfm / gpm** rather than raw m³/s.
- **Export** what you're looking at: copy a series to the clipboard, save it to
  CSV, or save your whole viewing session and reopen it later.

## Why you can trust the numbers

Reading `.eso` output and converting it is the kind of thing that can quietly go
wrong — an off-by-one row, a frequency mislabeled, a unit dropped. To prevent
that, the part of Timestep that does this conversion is now checked
**automatically, on every change**, against EnergyPlus's own native `.sql`
output. The two have to match row-for-row, at every reporting frequency, or the
build doesn't ship.

In short: when Timestep shows you a value from a converted `.eso`, it's the same
value EnergyPlus would have written to a `.sql` database itself.

## About the "core"

You may hear that v2 introduced a **core** library. You never touch it directly,
but it's worth knowing what it is and why it's good for you.

The logic that actually reads EnergyPlus files and pulls out timeseries used to
be tangled into the app. In v2 it's been lifted out into a self-contained,
independently tested piece — the *core*. Two reasons that matters:

1. **It's where the trust comes from.** The row-for-row checking described above
   lives in the core, run on every update.
2. **It's reusable.** Because the EnergyPlus-reading engine now stands on its
   own, the same tested logic can later power things beyond this one desktop
   app — batch processing, a notebook workflow, or a browser-based version —
   without anyone re-implementing the file parsing (and re-introducing the bugs
   that come with it). The desktop app is the first thing built on it, not the
   only possible thing.

## Getting it

Installers are published on the project's
[Releases page](https://github.com/michaelsweeney/timestep/releases):

- **macOS** — download the `.dmg`
- **Windows** — download the `.exe` (or `.msi`)
- **Linux** — `.AppImage`, `.deb`, or `.rpm`

This release is not yet code-signed, so macOS and Windows may warn you that the
app is from an unidentified developer the first time you open it — that's
expected for now; open it anyway (on macOS, right-click → Open).
