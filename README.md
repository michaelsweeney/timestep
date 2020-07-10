# Interactive timeseries visualizations for EnergyPlus.

EnergyPlus has very rich support for hourly and sub-hourly reporting, but as a model becomes larger and more complex, the simulation output size quickly becomes unwieldy for existing programs, most of which load the entire contents of the output into system memory. This results in prohibitively long load-times, especially considering the already-lengthy simulation time in comparison to other simulation engines.

Timestep attempts to solve this problem, offering a clean, user-friendly and near-instanteous querying interface, as well as modern data visualization capabilities. It accomplishes this by using the EnergyPlus SQLite Output reporting capability, and can load and visualize extremely large simulation output files in seconds, rather than minutes.

Current Timestep features:
- Native support for MacOS and Windows.</li>
- Heatmap, Multi-Line, Scatter Plot, Histogram, and Statistical Summary outputs</li>
- CSV and clipboard export</li>
- Support for multiple files</li>
- BND file cross-referencing (where available) for intelligent units parsing</li>

Future Timestep features:
- Capability of reading ESO files as well as SQLite Output files</li>
- Saved sessions</li>
- Support for tabular data (similar to eplusout.html reports)</li>
- Additional chart types like 2D hexbins, scatter matrices, and box/violin distribution plots</li>


Current Build (BETA) for Mac and Windows (includes sample SQL datasets): https://www.dropbox.com/sh/za0zxhf0hmzzme0/AAB6Q2os56CV9uYupeWaQmToa?dl=0

Install & Setup Instructions:

1. Download the current build from the above hyperlink for your operating system.</li>
2. (Optional): Download the SQL sample files via the same hyperlink.</li>
3. Unzip the directory and place it in its own folder.</li>
4. Double-click "timestep" (timestep.exe on Windows)</li>
5. If experiencing issues running the program on Windows, select "More Info" at the "Windows Protected Your PC" at the pop-up and then select "Run Away."</li>
6. If experiencing issues running the program on Mac, [use this link]("https://support.apple.com/guide/mac-help/open-an-app-from-an-unidentified-developer-mh40616/10.13/mac/10.13") to open packages from unidentified developers.</li>
7. Ensure that any desired EnergyPlus simulations have been run with the following command in the IDF file: "Output:SQLite, SimpleAndTabular"</li>
8. Click the "Load Files button", or drag a valid SQL file (or multiple SQL files) over the load files button.</li>
9. Start exploring results!</li>

Please email timestepvis@gmail.com with questions or feedback on the BETA release.


