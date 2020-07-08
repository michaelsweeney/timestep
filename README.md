<h1>Interactive timeseries visualizations for EnergyPlus.</h1>

EnergyPlus has very rich support for hourly and sub-hourly reporting, but as a model becomes larger and more complex, the simulation output size quickly becomes unwieldy for existing programs, most of which load the entire contents of the output into system memory. This results in prohibitively long load-times, especially considering the already-lengthy simulation time in comparison to other simulation engines.

Timestep attempts to solve this problem, offering a clean, user-friendly and near-instanteous querying interface, as well as modern data visualization capabilities. It accomplishes this by using the EnergyPlus SQLite Output reporting capability, and can load and visualize extremely large simulation output files in seconds, rather than minutes.

<u>Current Timestep features:</u>
<ul>Native support for MacOS and Windows.</ul>
<ul>Heatmap, Multi-Line, Scatter Plot, Histogram, and Statistical Summary outputs</ul>
<ul>CSV and clipboard export</ul>
<ul>Support for multiple files</ul>
  <ul>BND file cross-referencing (where available) for intelligent units parsing</ul>

<u>Future Timestep features:</u>
<ul>Capability of reading ESO files as well as SQLite Output files</ul>
<ul>Saved sessions</ul>
<ul>Support for tabular data (similar to eplusout.html reports)</ul>

Current Build (BETA) for Mac and Windows (includes sample SQL datasets): https://www.dropbox.com/sh/za0zxhf0hmzzme0/AAB6Q2os56CV9uYupeWaQmToa?dl=0
Please email timestepvis@gmail.com with questions or feedback on the BETA release.
