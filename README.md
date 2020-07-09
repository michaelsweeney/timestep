<h1>Interactive timeseries visualizations for EnergyPlus.</h1>

EnergyPlus has very rich support for hourly and sub-hourly reporting, but as a model becomes larger and more complex, the simulation output size quickly becomes unwieldy for existing programs, most of which load the entire contents of the output into system memory. This results in prohibitively long load-times, especially considering the already-lengthy simulation time in comparison to other simulation engines.

Timestep attempts to solve this problem, offering a clean, user-friendly and near-instanteous querying interface, as well as modern data visualization capabilities. It accomplishes this by using the EnergyPlus SQLite Output reporting capability, and can load and visualize extremely large simulation output files in seconds, rather than minutes.

Current Timestep features:
<ul>
  <li>Native support for MacOS and Windows.</li>
  <li>Heatmap, Multi-Line, Scatter Plot, Histogram, and Statistical Summary outputs</li>
  <li>CSV and clipboard export</li>
  <li>Support for multiple files</li>
  <li>BND file cross-referencing (where available) for intelligent units parsing</li>
 </ul>

Future Timestep features:
<ul>
  <li>Capability of reading ESO files as well as SQLite Output files</li>
  <li>Saved sessions</li>
  <li>Support for tabular data (similar to eplusout.html reports)</li>
  <li>Additional chart types like 2D hexbins, scatter matrices, and box/violin distribution plots</li>
</ul>

Current Build (BETA) for Mac and Windows (includes sample SQL datasets): https://www.dropbox.com/sh/za0zxhf0hmzzme0/AAB6Q2os56CV9uYupeWaQmToa?dl=0

Install & Setup Instructions:
<ol>
  <li>Download the current build from the above hyperlink for your operating system.</li>
   <li>(Optional): Download the SQL sample files via the same hyperlink.</li>
  <li>Unzip the directory and place it in its own folder.</li>
  <li>Double-click "timestep" (timestep.exe on Windows)</li>
  <li>If experiencing issues running the program on Windows, select "More Info" at the "Windows Protected Your PC" at the pop-up and then select "Run Away."</li>
  <li>If experiencing issues running the program on Mac, <a href="https://support.apple.com/guide/mac-help/open-an-app-from-an-unidentified-developer-mh40616/10.13/mac/10.13">Use this Link </a> to open packages from unidentified developers.</li>
  <li>Ensure that any desired EnergyPlus simulations have been run with the following command in the IDF file: "Output:SQLite, SimpleAndTabular"</li>
  <li>Click the "Load Files button", or drag a valid SQL file (or multiple SQL files) over the load files button.</li>
  <li>Start exploring results!</li>
</ol>

Please email timestepvis@gmail.com with questions or feedback on the BETA release.


