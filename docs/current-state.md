# Current development state

Updated 2026-09-25. Plugin **0.3.5**, Grafana **13.2.2**, provisional ID **urrizzz-interfacemap-panel**.
Implementation baseline: `48123ec`; this documentation handoff accompanies the push to `origin/main`.
Start with [agent handoff](agent-handoff.md), then [implementation plan](implementation-plan.md).
The [historical log](development-history.md) preserves previous work and failure investigations.

## Current position

M1 and M2 are owner-accepted. M3 is implemented and locally tested, including the owner's subsequent
visual/editor refinements; explicit final M3 acceptance is still pending. The latest request authorizes
updating documentation and pushing code, not starting M4 or declaring all acceptance criteria passed.

| Milestone | Current status | Remaining work |
| --- | --- | --- |
| M0 Foundation | Build/test/unsigned packaging implemented | Remote CI not verified |
| M1 Editor | Owner-accepted; later movement/router-size refinements implemented | Review new resize behavior with owner |
| M2 Frame adapter | Owner-accepted | Real VictoriaMetrics evidence belongs to M5 |
| M3 Renderer | Implemented and locally tested | Final owner review using [M3 checklist](m3-validation.md) |
| M4 Integration/setup | Layout/data/visibility persistence partly covered by M2/M3 | Configurable IF-MIB query presets and broader lifecycle audit |
| M5 Backend/performance | Not started | Real datasource/frame evidence, 12/24-hour and 10/50-element load tests |
| M6 Distribution | Deferred | Organization slug, permanent ID, license, signing and release route |

## Implemented behavior

- Datasource-independent panel consuming Grafana query results; no per-element fetches or polling.
  Panel mappings select identity labels and query/field roles; each traffic element selects a returned router/channel.
- Native 120 x 70 SVG plots with bright blue IN above zero and purple OUT below. Shared automatic scale
  follows observed traffic; capacity is separate. Current values are five-minute rates at dashboard range end.
- Borders and corner circles use green UP, red DOWN, gray UNKNOWN. Corner circles remain in BOTH modes.
  DOWN/UNKNOWN retain available history but use current dashes. Missing values remain gaps; zero stays zero.
- Compact mode defaults for unset settings: centered channel name + colored circle + status above the plot.
  Explicit saved visibility is respected. Full mode has configurable side metadata/capacity and status heading.
  No tiny 5m caption or routine Data available success row. Quality warnings and editor diagnostics remain.
- Red three-pixel center segments cover only observed historical outages. Hover uses actual five-minute
  sample values, displays a vertical cursor, and lists overlapping observed outage start/end times.
- Only the native panel editor enables mutations. Body clicks select; identical 22 px four-way handles
  above/right move routers and traffic. Selected elements have matching diagonal-arrow resize buttons.
- Traffic remains proportional, width 120-360. Routers resize independently within width 120-600 and
  height 48-320; unset legacy dimensions default to 150 x 64. Resize keeps top-left coordinates fixed.
  Connector endpoints/sides and scroll bounds follow current router geometry. Connections are not draggable.
- Schema 1 persists optional router dimensions, traffic visibility and mappings. Save/reload, duplication,
  Discard, zoom compensation and pointer-cancel restoration are implemented.

## Local runtime and data

Grafana: [owner dashboard](http://localhost:3001/d/network-map-data-dev), container
`interface-map-dev-grafana-1`; 1 GiB/one CPU, GOMEMLIMIT 300 MiB. Global Docker/WSL memory remains 4 GiB.
Port 3000 is a separate installation. Restart the existing container; do not recreate it and lose saved dashboards.

Datasource **Network Map Mock Frames** uses built-in TestData, UID `network-map-testdata`.
The fixed range is 2026-09-25 00:00-12:00 UTC. Three traffic channels have a recovered 00:50-01:00 outage;
BRANCH-01 Tunnel10 also goes DOWN 11:30-12:00. Traffic is irregular and zero during outages, with five-minute
window averaging. Tunnel99 is metadata-only/UNKNOWN. This does not validate a real VictoriaMetrics backend.

[generate_frame_demo.py](../dev/generate_frame_demo.py) generates the tracked fixture; regeneration can
replace a provisioned dashboard's saved layout. Back up dashboards first and preserve options, selections,
query customizations and time ranges. Existing repair backup: ignored, encrypted `data/mock-frame-repair-backup.json`.

## Verification evidence

| Evidence | Actual result |
| --- | --- |
| 0.3.5 npm run check | Typecheck, lint, 36 unit tests and production build passed |
| Latest layout browser checks | Four existing scenarios passed; new router-resize scenario passed on focused rerun after scrolling its off-screen 150% handle into view |
| Router resize evidence | 50/100/150% zoom, fixed position, changed connector endpoint, saved width/height and reload; legacy/invalid sizes and duplication covered in unit tests |
| 0.3.3 browser run | Seven layout/traffic scenarios passed, including handle-only movement for both types at six zoom levels |
| Mock repair | Eight Python tests passed; three renderer browser scenarios plus strengthened exact-outage/zero-rate check passed |
| 0.3.4 browser check | Success row absent; metadata and editor diagnostics retained |
| References | Diagram resize/icon smoke check passed; earlier compact/full state and theme checks passed |
| This documentation pass | Documentation/link/diff checks only; no fresh full runtime suite claimed |

Browser tests use isolated test dashboards and one worker. A single complete latest-version browser run
has not been claimed; results above distinguish full and targeted runs. Remote CI, signing, production
VictoriaMetrics compatibility and performance limits are unverified.

## Next concrete action

Review [M3 validation](m3-validation.md) with the owner; fix any reported issues and record explicit acceptance.
Then implement M4's configuration-first IF-MIB presets: configurable metric/label names and filters,
preview generated editable Grafana queries, preserve manual edits, and use supported APIs. Verify whether
a panel can install query targets through a supported API before promising a Load preset control;
otherwise generate an importable starter dashboard. No custom query executor or Grafana-core modifications.

Keep requirements, this state, the plan and validation guidance updated in the same task. Preserve the
provisional plugin ID for existing dashboards. Publication and licensing decisions do not block local work.
