# Current development state

Updated 2026-09-25. Plugin **0.3.8**, Grafana **13.2.2**, provisional ID **urrizzz-interfacemap-panel**.
Accepted M3 implementation baseline: `a26210c` on `main`; cloned handoff revision `9973e41`.
Publication: implementation, requirements and both-PC setup in `a26210c` were pushed to origin/main
using the configured `urrizzz` account. Remote main was verified at `ff03e3e`, which includes that
implementation and its state update. This documentation follow-up records the successful publication.
Remote CI and a signed plugin release remain unverified.
Start with [agent handoff](agent-handoff.md), then [implementation plan](implementation-plan.md).
The [historical log](development-history.md) preserves previous work and failure investigations.

## Current position

M1, M2 and M3 are owner-accepted. The owner explicitly accepted M3 on 2026-09-25 at plugin 0.3.8,
including the final faint-on-hover/full-on-selection handles and matching move/resize placement.
Both development PCs have setup/deployment profiles. M4 query presets and lifecycle audit are next;
M4 has not started. This acceptance does not establish production-backend or performance readiness.

| Milestone | Current status | Remaining work |
| --- | --- | --- |
| M0 Foundation | Build/test/unsigned packaging implemented | Remote CI not verified |
| M1 Editor | Owner-accepted, including subsequent editor refinements accepted with M3 | Maintain regression coverage |
| M2 Frame adapter | Owner-accepted | Real VictoriaMetrics evidence belongs to M5 |
| M3 Renderer | Complete; implemented, locally tested and owner-accepted in 0.3.8 | Retain [M3 checklist](m3-validation.md) for regression checks |
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
- In the panel editor, hovering an unselected element shows a subtle solid outline and both handles at 50% opacity.
  Selection retains its stronger dashed outline and handles after the pointer leaves.
- Only the native panel editor enables mutations. Body clicks select; background clicks deselect.
  Both 22 px handles are faint on hover and fully visible on the selected router/traffic block: move above/right and resize
  below/right, sharing a column and matching two-pixel vertical clearance.
- Traffic remains proportional, width 120-360. Routers resize independently within width 120-600 and
  height 48-320; unset legacy dimensions default to 150 x 64. Resize keeps top-left coordinates fixed.
  Connector endpoints/sides and scroll bounds follow current router geometry. Connections are not draggable.
- Schema 1 persists optional router dimensions, traffic visibility and mappings. Save/reload, duplication,
  Discard, zoom compensation and pointer-cancel restoration are implemented.

## Local runtime and data

Grafana: [owner dashboard](http://localhost:3001/d/network-map-data-dev), container
`interface-map-dev-grafana-1`; 1 GiB/one CPU, GOMEMLIMIT 300 MiB, Grafana Enterprise 13.2.2.
Owner PC checkout: `C:\code\grafana`. Yuri PC checkout: `C:\Codex\projects\grafana`.
Both have [setup/deployment profiles](development-pcs.md); only the Owner PC is accessible this session.
Use dev/Start-Review.ps1 to preserve an existing legacy container on the Yuri PC.
This PC's existing Docker/WSL settings and other containers are unchanged.
The named volume `interface-map-dev_grafana-data` now retains saved dashboards across container recreation;
never remove it or use `compose down -v`. Routine stop/start uses `docker compose stop` / `docker compose start`.
Restart policy is `unless-stopped`. Node 24.21.0/npm 11.19.0 is isolated under `C:\code\.tools\grafana`;
Python 3.11.9 and Docker Desktop were already installed. See the updated development guide for tool paths.

Datasource **Network Map Mock Frames** uses built-in TestData, UID `network-map-testdata`.
The fixed range is 2026-09-25 00:00-12:00 UTC. Three traffic channels have a recovered 00:50-01:00 outage;
BRANCH-01 Tunnel10 also goes DOWN 11:30-12:00. Traffic is irregular and zero during outages, with five-minute
window averaging. Tunnel99 is metadata-only/UNKNOWN. This does not validate a real VictoriaMetrics backend.

[generate_frame_demo.py](../dev/generate_frame_demo.py) generates the tracked fixture; regeneration can
replace a provisioned dashboard's saved layout. Back up dashboards first and preserve options, selections,
query customizations and time ranges. The old PC's ignored repair backup and saved dashboard database were
not in Git and have not been transferred. This PC starts from the committed fixture layout and A-H queries.

## Verification evidence

| Evidence | Actual result |
| --- | --- |
| M3 owner acceptance | Explicitly accepted on 2026-09-25 at 0.3.8; includes latest hover/selection controls and placement. No additional individually performed checks are inferred |
| 0.3.8 verification | Typecheck, lint, all 36 unit tests and production build passed. Focused browser checks passed for 50%-opacity hover buttons, direct move/resize via the external handles, full-opacity selection, leave/deselection and view mode in both themes; dark-theme screenshot inspected and reference refreshed |
| 0.3.8 editor regressions | Six-zoom movement/resize/view-mode and compact/full visibility/save-reload scenarios both passed (2/2 focused tests) |
| 0.3.8 deployment | Shared launcher restarted existing Grafana 13.2.2; saved owner dashboard preserved; publication tracked at the top of this document |
| 0.3.7 verification | Typecheck, lint, all 36 unit tests and production build passed. Focused Chromium checks passed for router/traffic hover, persistent selection, deselection and view mode in both themes. Reference screenshot updated after correcting only a CSS color-serialization expectation; light-theme runtime screenshot visually inspected |
| 0.3.7 deployment | Restarted existing local Grafana 13.2.2 through shared launcher; saved dashboards preserved; historical deployment evidence |
| 0.3.6 npm run check | Typecheck, lint, 36 unit tests and production build passed; initial runner stopped on native stderr due to PowerShell error preference, corrected and complete check rerun passed |
| 0.3.6 browser checks | Eleven scenarios passed in the suite; the six-zoom movement/selection/alignment scenario passed on focused rerun after correcting an overlapping test click (router and traffic shared coordinates). Compact/full placement, selection-only controls, background deselection, resize and persistence checked |
| 0.3.6 references | Diagram mockup selection/alignment smoke check passed; reference screenshot refreshed; actual selected-router/traffic screenshots visually inspected without saving owner dashboard |
| 0.3.6 deployment | New Owner-profile launcher deployed and health-checked Grafana 13.2.2/plugin 0.3.6; container ID remained identical; Yuri profile documented, not executed remotely |
| 0.3.5 npm run check | Typecheck, lint, 36 unit tests and production build passed |
| Latest layout browser checks | Four existing scenarios passed; new router-resize scenario passed on focused rerun after scrolling its off-screen 150% handle into view |
| Router resize evidence | 50/100/150% zoom, fixed position, changed connector endpoint, saved width/height and reload; legacy/invalid sizes and duplication covered in unit tests |
| 0.3.3 browser run | Seven layout/traffic scenarios passed, including handle-only movement for both types at six zoom levels |
| Mock repair | Eight Python tests passed; three renderer browser scenarios plus strengthened exact-outage/zero-rate check passed |
| 0.3.4 browser check | Success row absent; metadata and editor diagnostics retained |
| References | Diagram resize/icon smoke check passed; earlier compact/full state and theme checks passed |
| New-PC build, 2026-09-25 | Node 24.21.0/npm 11.19.0: typecheck, lint, all 36 unit tests and production build passed |
| New-PC mock data, 2026-09-25 | All eight Python tests passed using Python 3.11.9 |
| New-PC runtime, 2026-09-25 | Docker Grafana Enterprise 13.2.2 reports database ok; plugin metadata reports 0.3.5; named database volume verified |
| New-PC browser suite, 2026-09-25 | All 12 Chromium tests passed together in 2.3 minutes with one worker: data mappings/selections, editor, zoom, duplication, discard, router sizing, traffic/status/hover, themes and persistence; rendered dark-theme screenshot visually inspected |
| New-PC setup | Official Node SHA256 verified; locked npm install passed on retry after ECONNRESET, using cached packages and lower download concurrency; Playwright Chromium installed |
| New-PC documentation | Updated setup/persistence instructions; local Markdown links and git diff --check passed |

Browser tests use isolated test dashboards and one worker. Previous-PC results above distinguish full
and targeted runs. Remote CI, signing, production VictoriaMetrics compatibility and performance limits are unverified.

## Next concrete action

Proceed with M4's configuration-first IF-MIB presets: configurable metric/label names and filters,
preview generated editable Grafana queries, preserve manual edits, and use supported APIs. Verify whether
a panel can install query targets through a supported API before promising a Load preset control;
otherwise generate an importable starter dashboard. No custom query executor or Grafana-core modifications.

Keep requirements, this state, the plan and validation guidance updated in the same task. Preserve the
provisional plugin ID for existing dashboards. Publication and licensing decisions do not block local work.
