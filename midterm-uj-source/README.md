# midterm uj

A standalone 2026 U.S. Senate dashboard with five maps: current seat control, Shaurya's predictions, Shipra's predictions, Siena and CNN/SSRS polling averages plus expected winners, and a one-button election simulator.

## Run locally

1. Extract this ZIP.
2. Open a terminal in the extracted folder containing `index.html`.
3. Run:

   ```sh
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000 in your browser.

Use a local web server: opening `index.html` directly as a file can block the JSON data requests.

## Deploy

This is a static website. Upload the contents of this folder to your static host's publish directory, preserving the filenames and keeping `index.html` at its root.

- Framework: none / static HTML
- Build command: none
- Publish/output directory: the folder containing `index.html` (often `.`)
- Environment variables and API keys: none
- Server-side application or database: none

If deploying from a Git repository, commit this folder's contents and configure your host to serve that directory. If the host asks for a build command, leave it blank. If deploying through an upload interface, upload the extracted files or folder as supported by your host.

The original ChatGPT hosting identity, Git history, credentials, and private access configuration are intentionally excluded. Access controls for your independent deployment are determined by your host.

## Files

- `index.html`: layout, headings, source links, and methodology.
- `style.css`: responsive styles. Google Fonts are optional; system fonts are used if unavailable.
- `app.js`: map rendering, saved personal picks, race filters, CSV export, polling, race ratings, and simulation logic.
- `candidates.json`: ballot-listed candidates for all 35 Senate races, excluding write-ins.
- `map.json`: precomputed SVG geometry and state label positions used by the app.
- `us.json`: original US Atlas topology used to generate map geometry; retained for reference.

## Data and updates

The election data is an October 31, 2026 snapshot. It does not automatically refresh. Edit the `polls` and `ratings` objects in `app.js` and `candidates.json` to update it. Update the dates and methodology in `index.html` when changing the snapshot.

Polls link to Siena Research Institute and CNN/SSRS. The latest verified poll from each pollster receives equal weight where both cover a state; single-poll states retain that poll. Missing candidate shares are excluded rather than treated as zero, and marked as one-poll shares. CNN/SSRS October 29 releases cover Kansas, Maine, Michigan, and Texas. Source results remain visible in the table and details. Expected winners use Cook Political Report's October 30 ratings when no verified Siena poll is available. Assumptions are identified with striped shading. Tied polls remain uncalled on the polling map.

Personal predictions save in the browser's local storage. They do not sync between devices or users. Moving to a different hostname will not transfer existing predictions. The CSV export can preserve a readable copy of personal picks.

## Simulator

Press Simulate election to generate all 35 race outcomes. Click a state on map 5 to see its candidate shares, winning margin, party swing, and starting assumptions. The national swing and net seat changes appear above the map.

Use Random swing to draw a fresh nationwide margin shift, or Set party swing to enter a value from -20 to +20 margin points. Positive values favor Democrats or the modeled non-Republican challengers; negative values favor Republicans. Settings affect the next run. Each state still gets independent random variation. Personal predictions are separate from simulator outcomes.

Georgia starts with Ossoff +8 and North Carolina with Cooper +12, as user-provided scenario settings. Montana models Seth Bodnar, Kurt Alme, and Alani Bankhead, using user-provided screenshot shares (Alme 30%, Bodnar 26%, Bankhead 21%) normalized among those three for simulation. The polling map preserves the raw shares; pollster and dates were not supplied. Alaska models Mary Peltola, incumbent Dan S. Sullivan, and Daniel J. Sullivan Jr.; the last candidate starts at an illustrative 1% for fun. These two Sullivans are distinct candidates.

Other races use the verified polling-average margin where available, or assumed margins based on ratings: Solid 20 points, Likely 10, Lean 5, and Toss-up 0. Random national variation has a standard deviation of 3 margin points and state variation 4. Three-way races also vary independent support. Displayed shares sum to 100% among modeled candidates. Independent winners count separately, with no caucus assumed.

This is an illustrative model, not a calibrated forecast or a Siena/Cook probability estimate. It omits ranked-choice transfers, runoffs, turnout, and stale-poll uncertainty. Full details appear in the website methodology.

Change simulatorMargins and threeWayScenarios in app.js to edit the custom scenarios.

## External sources and assets

- Candidate directory: https://ballotpedia.org/United_States_Senate_elections,_2026
- Siena polling: https://sri.siena.edu/2026/10/
- Race ratings: https://www.cookpolitical.com/ratings/senate-race-ratings?check_logged_in=1
- Map geometry: https://github.com/topojson/us-atlas
- Optional typography: Google Fonts, DM Sans and Libre Caslon Display.

Retain source attribution and check the respective providers' terms for any reuse of their materials.
