# Current development state

Last updated: 2026-09-25. Published baseline: `31a216f` on `origin/main`, including accepted M2 and configuration-first setup requirements. Push and matching remote HEAD verified before starting M3. M3 is saved in the local implementation commit following that baseline; it has not been pushed.
This document records verified implementation state, not intended behavior. Follow the
[implementation plan](implementation-plan.md) for the work sequence and [development guide](development.md)
for commands/environment. Update this document with every meaningful development increment.

## Current position

**M3 compact renderer implemented and verified locally; owner acceptance pending. M1 and M2 remain accepted.**
Running version: **0.3.3**, Grafana 13.2.2 on port 3001. Native 120 x 70 SVG graphs show blue IN,
purple OUT, shared automatic axes, matching range-end values and status borders. Historical outages
appear only over known DOWN intervals; DOWN/UNKNOWN retain available history with current dashes.
Hover snaps to complete five-minute buckets and reads actual samples in an external tooltip.
Per-block Show interface details defaults to false. Turning it off collapses the side block and centers the channel name plus colored circle/status above the graph.
Routers and traffic use the same four-way handle above the top-right edge in edit mode; body clicks select without dragging.
The corner status circle remains visible in both modes; graph coordinates are preserved. Individual field choices persist.

Open the [existing data dashboard](http://localhost:3001/d/network-map-data-dev) and follow
[M3 validation](m3-validation.md). Its saved selections, queries and layout are preserved.
The dev container was restarted, not recreated; the 1 GiB limit remains. Mock frames now use status-consistent
traffic: recovered 00:50-01:00 outages and a final 11:30-12:00 outage on BRANCH-01 Tunnel10.
Configuration-first editable IF-MIB presets are newly planned for M4, also not implemented yet.
No production VictoriaMetrics compatibility or rate semantics are claimed.

| Milestone | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 Foundation | Complete locally | Build/test tooling and unsigned packaging; remote CI unverified |
| M1 Diagram model/editor | Complete; owner-validated | Saved layouts, native edit lifecycle, routing, zoom, resizing, duplication, safe removal |
| M2 Frame adapter | Complete locally; owner-accepted | 30 unit tests, eight browser scenarios across suite/targeted rerun; see guide and evidence below |
| M3 Traffic renderer | Implemented and tested locally; owner review pending | Bars/axes/hover, state borders, hidden details and visibility persistence |
| M4 Integrated diagram | Partially implemented via M2/M3 | Query presets, broader lifecycle audit and acceptance remain |
| M5 Backend/quality audit | Not started | Synthetic fixtures only; production frames, rates and capacity/performance audit pending |
| M6 Distribution | Deferred | Organization, permanent ID, license and publication route undecided |

## Implemented assets

| Area | Current implementation |
| --- | --- |
| Panel registration | [src/module.ts](../src/module.ts), provisional ID urrizzz-interfacemap-panel; Network Traffic Map |
| Runtime UI | [InterfaceMapPanel.tsx](../src/components/InterfaceMapPanel.tsx): native panel editing, layout and result-driven selectors and compact SVG renderer |
| Data model/adapter | [adapter.ts](../src/data/adapter.ts), [model.ts](../src/data/model.ts): normalized history/current/status/capacity/metadata/quality |
| Saved options | Schema 1 layouts preserved; optional identity/role mappings and visibility settings use backward-compatible defaults |
| Local Grafana | Enterprise 13.2.2 at localhost:3001; 1 GiB/one CPU cap, GOMEMLIMIT 300 MiB |
| Provisioning | Original layout dashboard plus independent TestData datasource and network-map-data-dev dashboard |
| Fixture generator | [generate_frame_demo.py](../dev/generate_frame_demo.py), deterministic labelled query frames at a fixed historical range |
| Validation | 35 unit tests; eight existing browser scenarios plus three renderer scenarios passed across suite/targeted runs; typecheck/lint/build pass |
| CI / packaging | Existing workflows; remote run/signing/publication unverified; local build outputs ignored |
| Mock metrics | Existing exporter/history tools remain separate; no production endpoint configured |
| Design references | Approved diagram/traffic mockups now include Show interface details controls |

## Confirmed direction to preserve

Grafana's normal query editor configures the datasource and one or more queries for all needed routers and
channels. Traffic elements select from those returned results. The panel must be datasource-independent,
with configurable identity and result-role mappings; instance/ifName are defaults. There is no planned
VictoriaMetrics-specific query coordinator or per-element query execution. VictoriaMetrics remains the
first deployment example. Queries return five-minute rates in bit/s; the renderer does not rate them again.

A missing selected channel stays in place with UNKNOWN/no data. The graph is natively 120 x 70 with
metadata on its right. Status-colored borders, blue/purple directions, historical outage segments and
hover follow the accepted references. Connections adjust sides while routers move in the implemented editor. M3 renders the normalized data supplied by M2; visual owner acceptance is pending. See [decisions](decisions.md) for the full record.

## Verification ledger

| Date / source | Check | Result and limits |
| --- | --- | --- |
| 2026-09-25, scaffold work aa6339e | npm run check | Passed typecheck, source lint, one provisioning unit check and production build |
| 2026-09-25, scaffold work aa6339e | Python unittest discovery in dev | Five mock-data tests passed |
| 2026-09-25, scaffold work aa6339e | npm run e2e on Grafana 13.2.2 | One loading smoke test passed after server readiness; initial premature attempt failed to connect |
| 2026-09-25, scaffold work aa6339e | Development packaging | ZIP root, compiled module, metadata version and SHA1/SHA256 checked |
| 2026-09-25, mockup work 2fc9145 | Browser geometry/interaction checks | 690 connection geometries, three zoom levels and reload checked in HTML mockup only |
| 2026-09-25, query-doc update 4816d55 | Docs | Links, diff and changed-file encryption checked; runtime tests not rerun for doc-only change |

Scaffold ledger rows are historical. M1 adds 11 passing unit checks, typecheck/lint/build and expanded
browser validation. Four browser tests passed against Grafana 13.2.2 after the final runtime changes: editing/routing/resize/
save-reload, pointer movement at three zooms with scrolling, native panel duplication/isolation and legacy empty layout.
`npm run check` passed. Remote CI is not checked; these changes are not pushed. Earlier browser locator failures
were corrected with accessible selector names and a viewport large enough to render both duplicated panels.
Actual dashboard JSON confirmed separate saved options for both panels.

The first development container was OOM-killed at its 512 MB cap with default background plugins enabled.
The isolated Compose setup now disables optional preinstallation/updates and sets GOMEMLIMIT=300MiB inside
the unchanged 512 MB/one CPU container. The global WSL limit remains unchanged. This is a local runtime fix,
not a claim of production capacity. The development instance remains available for owner validation at localhost:3001. After the browser suite,
Docker reported 426.3 MiB of its 512 MiB limit and OOM=false; this is a point-in-time measurement.

Current acceptance: M1 and M2 are owner-accepted; M3 awaits owner review. M2 automated checks exercise configurable roles,
identity isolation, metadata-only channels, missing/stale data, ambiguity, variables and persistence.
Production-shaped backend evidence and full performance/acceptance auditing remain M4-M5 work.

## Open questions and limits

| Item | Impact | When to resolve |
| --- | --- | --- |
| Exact returned frame layouts and metadata joins | Needed for robust role/identity mapping; use generic fixtures now | M2, confirm with real backend in M5 |
| Status freshness and sample-coverage evidence | Cannot infer source quality from evaluated values alone | M2 contract/fixtures and M5 query examples |
| Sanitized port/tunnel samples and VictoriaMetrics plugin version | Needed to verify production-shaped integration | M5; not a blocker to M1 |
| Long metadata fitting | Router labels truncate with a title; side metadata wraps in a separate fixed-width block; owner readability review pending | M3 owner review |
| Practical component-count/performance limits | Not measured in the real plugin | M5 |
| Dependency peer/deprecation warnings | Known from install; shell works, broader UI usage unverified | Reassess when introducing relevant UI components |
| Grafana Cloud organization and permanent ID | Owner has no Cloud account; provisional ID accepted for local work | Before signing/publication |
| Project license and distribution route | Package currently private/UNLICENSED; no signing token configured | M6 |

There is no known implementation blocker; M3 owner visual review is the next gate. Unknown backend details do not justify hardcoding the datasource.
No production credentials are required for fixture-based implementation.

## Next concrete work

Owner accepted the M2 preview after validation and query-setup clarification. Keep [M2 validation](m2-validation.md)
as the regression checklist; no further M2 owner gate remains.

Owner: follow [M3 validation](m3-validation.md), especially native-size readability, hover, hidden details and save/reload.
Development after acceptance: M4 configuration-first IF-MIB presets and the remaining integrated lifecycle audit.
Keep queries at panel level. Gather sanitized production frame examples for the later M5 audit.

## Maintenance and handoff

At the end of each development increment replace the milestone/next-work entries with the actual state.
Add dated verification evidence with code revision when available, failures and limits; do not erase useful
failure explanations. Separate current blockers from future publication decisions. Record user scope changes
in decisions/product requirements and adjust the plan if needed.

Before claiming readiness, list acceptance results with their evidence and remaining failures. Distinguish
implemented, tested locally, tested in CI, and published. Do not put secrets or production metric samples
with sensitive labels in this document. Keep this file concise as completed work accumulates.

## Owner review: dropdown sizing (2026-09-25)

The owner reported clipped dropdowns. Browser inspection confirmed the zoom select was only 12 px high.
The editor now sets native selects to 32 px with a 20 px line height, reserves an 80 px zoom width, and
uses Grafana theme colors for selects/options. This applies to zoom and the element/endpoint selectors.
Verified in the rebuilt Grafana panel: all zoom/element/endpoint selects measure 32 px, selected text is
present, selection changes work, and dark/light colors follow Grafana. npm run check passes (11 unit tests).
Other M1 review items remain open to owner feedback.

### Dropdown follow-up

The owner reported that the size-only fix did not resolve the appearance. Earlier checks covered closed
native selects, not the open menus. All dropdowns (zoom, element selection, traffic router and connection
endpoints) now use Grafana's Combobox. Editor form CSS targets only explicitly marked native controls and
does not style Grafana component internals. Verification passed: npm run check (11 unit tests), all four updated editor browser tests, and opening all
five dropdowns in dark/light themes at a 1000 px viewport. Keyboard selection and Escape work. Open-menu
screenshots were visually inspected; labels/items are readable and menus are not clipped. Screenshots are
local artifacts under data/dropdown-*.png. The earlier size-only workaround is superseded.

### Dropdown delivery follow-up (2026-09-25)

The owner still saw no change after the Combobox update. A fresh browser loaded the corrected controls,
but the plugin bundle was served with `Cache-Control: public, max-age=3600` and the unchanged URL
`module.js?_cache=0.1.0`. A previously cached bundle could therefore hide the fix; the owner's exact
browser URL/cache state has not yet been confirmed. Port 3000 is a separate Grafana instance without
this plugin; development runs at http://127.0.0.1:3001/d/interface-map-dev.

Bumped package and lockfile to 0.1.1, rebuilt, and restarted the existing development container without
recreating it. Browser verification confirmed Grafana now requests `module.js?_cache=0.1.1`, the zoom
Combobox is 32 px high, its menu opens, and no native selects remain on the page. The production build
passed. Reload the development dashboard to load the new version; owner subsequently confirmed the dropdowns are fixed (see next entry).

### Native panel editor integration (2026-09-25)

Owner confirmed dropdowns are fixed. Removed the separate Edit layout/Finish layout button. Layout
controls now follow the active panel ID in Grafana's editPanel navigation through locationService and
React's external-store subscription. Dashboard view and dashboard grid editing cannot mutate the diagram;
save and pointer handlers are guarded, and leaving the editor clears an active drag. Zoom remains usable.
Back retains pending edits; Grafana Save persists them; Discard restores the original diagram.

Version 0.1.2 was built and loaded by restarting the existing container (no recreation). npm run check
passed: typecheck, lint, 11 unit tests and production build. Five browser scenarios passed across the final
suite run and targeted duplication rerun: editor/save/reload, pointer/zoom/read-only, independent panel
copies, discard, and legacy empty options. Initial tests started before server readiness; rerun after health
was healthy resolved connection errors. The duplication test then needed a visible-hover-menu locator;
its targeted rerun passed. Requirements, decision log, plan, reference notes and M1 checklist are updated.

Validate: reload port 3001, verify no layout buttons on the dashboard (including grid edit mode), open
panel menu > Edit, arrange elements, use Back, then Save. Reopen and Discard a temporary edit. M1 owner
review remains open; M2 metric/frame integration is still the next implementation milestone. Changes local.

### Documentation maintenance requirement (2026-09-25)

Owner requires documentation and current state to stay updated throughout development. AGENTS.md now
makes same-task maintenance a completion requirement, including current summaries/tables, affected
requirements and validation instructions. Reconciled this summary with version 0.1.2, five passing browser
scenarios and the confirmed dropdown fix. Documentation-only change; runtime tests were not rerun.

### Owner validation: editing modes (2026-09-25)

Owner confirmed individually: routers stay locked in normal dashboard view; dashboard Edit allows moving
whole panels while internal routers stay locked; Edit visualization automatically exposes layout controls
and allows router movement; Back hides controls and locks routers again. These four checks pass by owner
observation. Owner also confirmed the moved router retains its position after Save and browser reload. Owner confirmed Discard restores the router to its saved position after a temporary move. Other persistence fields and remaining M1 checks are pending; owner confirmed Add router creates a new router with its settings ready to edit. Owner confirmed edited router name and instance are retained after switching selection away and back. Owner confirmed Add traffic creates a component bound to the selected router. Remaining checks are being presented together; owner will report failures by number.
Owner now requests all remaining validation checks together and will report failures; this supersedes the earlier one-question-at-a-time preference. No runtime changes or new automated tests.

### M1 owner review and polish (2026-09-25)

Owner passed checks 2-11: independent movement, automatic connection sides, overlap suppression,
endpoint validation, resizing, original zoom levels, element/panel duplication, safe removal and saved
configuration persistence. Check 1 is a requirement clarification: channel metadata must come from router
metric query results, with metric/query and label/field mappings in panel configuration. Manual M1 fixture
fields are temporary; replacing them remains M2/M4 work, not a completed live-data feature.

Added zoom levels 25%, 50% and 150%. Failed actions now show a prominent Grafana warning below the toolbar
with Dismiss. Successful mutations and element selection clear it; no read-time deadline is imposed.
The permanent save hint no longer carries old errors. Version 0.1.3 built and loaded by restarting the
existing container. npm run check passed (typecheck, lint, 11 unit tests, build). Browser verification passed across the suite and targeted rerun: all six zoom levels, warning dismissal,
selection/success clearing, routing/save, panel duplication, discard and legacy empty options. Initial failures
were test assumptions: Grafana overrides the dismiss button accessible name, and the owner has saved a
nonempty development dashboard. The empty-options test now uses its own dashboard, preserving owner data. Owner confirmation of the added zoom levels and warning behavior remains
pending. Next implementation milestone is M2. Changes remain local and uncommitted.

### Compact warning correction (2026-09-25)

Owner reported the 0.1.3 warning expanded and pushed the diagram down. Replaced the in-flow Grafana
Alert with a themed, dismissible overlay over the graph area, clear of the settings sidebar. Maximum
width 340 px and height 110 px; longer content scrolls. Selection/success clearing remains unchanged.
This supersedes the earlier in-flow warning. Version 0.1.4 is running locally; docs and checklist updated.

npm run check passed (typecheck, lint, 11 unit tests, build). After a positioning-only adjustment, rebuild
and targeted browser regression passed: warning fits the size bounds, viewport bounds are exactly
unchanged, the selector stays usable, dismissal/automatic clearing work, and saving/reloading works.
The first overlay position covered the selector; the final position reserves the sidebar. Owner visual
confirmation remains pending. M1 core remains validated; M2 is next. Changes local and uncommitted.

### M1 acceptance and product name (2026-09-25)

Owner confirmed all works, completing M1 review including compact warning/zoom refinements, and chose
Network Traffic Map as the visualization name. Updated plugin metadata, visible component labeling,
README, project docs and design-reference titles where applicable. Keep the provisional plugin ID
urrizzz-interfacemap-panel and internal code identifiers stable for dashboard compatibility. Existing
provisioned dashboard/panel titles remain unchanged to avoid overwriting the owner's saved layout;
these are dashboard titles, independent of the visualization picker name. Version 0.1.5 includes this rename.
Accumulated M1 implementation, requirements and development records are saved together in a local Git
commit; no push requested. M2 returned-data mapping is the next implementation step.

Rename validation: npm run check passed (typecheck, lint, 11 unit tests, build); all five browser tests
passed together on 0.1.5. Grafana plugin settings reports Network Traffic Map version 0.1.5. Staged diff
checks and source encryption checks passed. This commit includes all accumulated source/docs changes.

### New requirement: Show interface details (2026-09-25)

Documented the owner's per-traffic-block visibility option: default on; off removes all side information
and spacing, shrinking the block footprint while leaving graph size/position unchanged. Show a range-end
status circle inside the graph top-right when hidden; green/red/gray for UP/DOWN/UNKNOWN. Preserve border,
values, hover, selections and metadata preferences. Acceptance criteria AC-53/54/55 cover rendering and
saved option isolation. Product spec, decisions, implementation plan and reference notes updated.
Requirement-only change, not implemented or visually validated; no runtime tests rerun. M1 remains accepted.

### Repository publication (2026-09-25)

Pushed M1 code, all accumulated documentation, and the new Show interface details requirement to
urrizzz/grafana main through feb4ed4. Runtime remains 0.1.5; the new visibility option is requirements-only.
Documentation diff checks passed; no runtime changes or additional runtime tests for this publication.
Remote CI results have not been checked.

### M2 work in progress (2026-09-25)

Implemented src/data/model.ts and adapter.ts: configurable query reference/field roles, labelled wide
series and table identity/metadata, independent channel index, aligned history, range-end currents,
capacity conversion, status/down intervals and explicit quality/ambiguity diagnostics. Panel options
expose identity and role mappings. Editor uses returned router/channel choices, retains unavailable
selections, and no longer exposes manual alias/description inputs. Original schema/layouts still load.

A separate TestData datasource/dashboard supplies two routers, shared tunnel names and a metadata-only
channel. dev/generate_frame_demo.py reproduces its frames. The owner's existing dashboard is preserved.
Version 0.2.0 is being validated; M3 bars/hover and Show interface details remain unimplemented.

### M2 final verification (2026-09-25)

Version 0.2.0 is implemented and available locally. npm run check passed (typecheck, source lint, 30 unit
tests and production build). Eight browser scenarios passed across the final suite and targeted mapping
rerun: M1 editor lifecycle plus returned-data isolation/selection/metadata, save/reload, no per-element
querying, scalar variable changes/All rejection, and editing panel mappings. The mapping test initially
used a shorter accessible name than Grafana exposes; it passed after including the help-text prefix.

Actual TestData frames were rendered through Grafana's normal query path. A direct exploratory query API
request without Grafana's full query envelope returned HTTP 500; the normal browser pipeline and tests
passed. M2 editor screenshot data/m2-editor.png was inspected for usable layout. Docker memory was
332.2 MiB of its 512 MiB limit at verification; no production performance claim is made.

Current rates require exact range-end evaluations; status/capacity freshness uses a 180-second policy.
Optional source timestamps/counts are explicit evidence; absent evidence remains unverified. Query
errors/loading suppress current values. Duplicate series/dimensions produce visible ambiguity, not sums.
Only labelled series and identity-bearing tables are supported; ifIndex-only joins await real-frame evidence.
Legacy saved metadata is ignored in favor of query data. The new compact renderer/visibility toggle remain
M3 work. Owner M2 review pending. Documentation and implementation are saved together locally; not pushed.

### Development memory allowance (2026-09-25)

Owner authorized increasing the development container limit within Docker's existing 4 GiB budget.
Raised Grafana's hard memory limit from 512 MiB to 1 GiB in Compose and the running container via docker
update, preserving its container ID and saved dashboards. Combined RAM+swap ceiling is 2 GiB, matching
Docker's default for a 1 GiB RAM limit. One CPU and the existing 300 MiB Go soft target remain unchanged;
the higher hard ceiling provides headroom for process/native/cache memory. Docker's global limit is unchanged.

Memory verification: live inspect reports 1073741824 bytes RAM, the same container ID, and healthy status.
Usage sampled at 236.7 MiB / 1 GiB; docker compose config --quiet passed. M2 and this configuration update
are saved in a local development commit; no push was requested for this increment.

### Owner M2 save/reload report (2026-09-25)

Owner confirmed validation steps 1-6, then reported all channels UNKNOWN after Save/reload. Inspected
network-map-data-dev version 2: its eight raw-frame queries had been replaced by one Random Walk query A;
layout, options, datasource and fixed time range remained. Saved an encrypted diagnostic snapshot under
ignored data/, then restored only targets from the checked-in fixture through Grafana's API (version 3).
Verified options and time range identical before/after. Fresh browser shows 2 routers / 4 channels,
CORE-01 GigabitEthernet0/1 UP with Uplink/Physical uplink/1 Gbit/s, and BRANCH-01 Tunnel99 correctly UNKNOWN
with metadata (no rates/status by design). Owner confirmed changing to another datasource and then selecting the mock datasource again.
This reset queries; reselecting a datasource does not restore its old queries. Save persisted that changed
query configuration. No plugin runtime change was needed. Extended save/reload browser coverage to assert all eight
query IDs, Raw Frames scenarios and exact rawFrameContent survive, rather than only the resulting display.

The strengthened browser save/reload test passed with all eight query definitions preserved exactly.
Documented datasource-switch behavior and advised reloading the repaired dashboard before further edits.
Owner should repeat save/reload without switching the demo datasource; M2 overall approval remains pending.

### Configuration-first setup requirement (2026-09-25)

Owner approved reducing manual query setup through IF-MIB presets and configuration. Added panel-level
metric/label names and shared filters, generated editable Grafana queries/mappings, explicit preview/apply,
manual-edit preservation, persistence and datasource-compatibility criteria AC-56 through AC-59.
Direct query installation needs supported-API verification; configured starter-dashboard import is the
fallback. Implementation is M4 work; current 0.2.0 behavior and M3 next-step order are unchanged.
Updated product spec, decisions, acceptance criteria, implementation plan and M2 guide. Documentation-only
change; diff checks only, no runtime tests rerun. Saved locally, not pushed.

### Owner accepts M2 (2026-09-25)

Owner reports everything looks good after the query restoration and configuration-first setup discussion.
Record M2 owner acceptance; do not infer additional individually performed checks beyond prior reports.
Existing automated evidence remains 30 unit tests and eight browser scenarios. No runtime changes or new
tests for this status update. M3 renderer is the next milestone; presets remain M4 and real backend
validation remains M5. Documentation saved locally; no push requested.

### M3 compact rendering (2026-09-25)

Pushed accepted M2 to origin/main first (`31a216f`), then implemented the renderer independently of
datasource code. Version 0.3.0 avoids the earlier browser plugin cache problem. Both HTML reference
variants now support Show interface details. Saved schema-1 layouts default to showing details;
duplication copies field settings independently. Query definitions and the owner dashboard were preserved.

Verification: npm run check passed (typecheck, lint, 35 unit tests, production build). Eight existing
browser scenarios passed in the suite; three renderer scenarios passed in the focused rerun after the
SVG coordinate correction. Coverage includes native size, 180/240 px widths, light/dark themes, retained
DOWN/UNKNOWN history, missing versus zero values, outage segments, hover and independent saved visibility.
An additional isolated browser check confirmed long unbroken metadata wraps without graph overlap and
hiding tall metadata preserves graph x/y/width. Both HTML reference toggles passed Chromium smoke checks without script errors. Dark/light screenshots
were inspected locally. Initial browser failures exposed test-selector collisions, SVG line zero-width
visibility assertions, and a real border-related hover offset; the renderer now uses inverse SVG screen
coordinates. Screenshot review also prompted theme-aware diagram backgrounds and router text.

Owner validation is pending; follow the M3 guide. M3 is committed locally but not pushed. IF-MIB presets
remain M4, real backend/performance evidence remains M5, and signing/distribution remains M6.

### M3 owner corrections (2026-09-25)

Version 0.3.1 removes the tiny current-window caption, defaults unset blocks to compact mode and places
the channel name centered above the graph. Explicit saved visibility values are retained. Outage line
inspection confirmed the fixture contains a 00:50-01:00 outage, just 1.3 px wide across 12 hours at native
size; the DOWN fixture spans the entire range. Increased line thickness from 1.5 to 3 px without changing
time endpoints. Hover now lists overlapping observed outage start/end times. Unknown/gaps are not outages.
Updated both references and requirements. npm run check passed: typecheck, lint, 35 unit tests and build.
Both reference default-mode browser checks passed. The 11-scenario browser suite passed, including exact
outage timestamps/hover, centered compact heading, explicit details opt-in and save/reload. Screenshot
review confirms the thicker line and headings. Changes saved locally; not pushed; owner review pending.

### Mock traffic/status consistency repair (2026-09-25)

Supersedes the original all-range-DOWN fixture mentioned above. The frame generator now uses one
status timeline for history and current values, with zero minute traffic during outages. Incoming and
outgoing use independent seeded irregular traffic; five-minute averages and instant/history endpoints
agree. The branch is UP before its final 11:30 outage. Recovered outage remains 00:50-01:00.
Regenerated source fixture and repaired local demo queries, preserving saved options/layout/time range;
an encrypted ignored backup is in data/mock-frame-repair-backup.json. Plugin remains 0.3.1; no renderer
change. Eight Python tests pass, including three new frame consistency tests. All three renderer browser scenarios passed; the strengthened exact-outage/zero-rate scenario also passed
in a focused rerun. Typecheck passed. Saved owner and comparison dashboard options/time ranges were verified
after provisioning and restored after test execution.
Changes local, not pushed; M3 owner acceptance remains pending.

### Status headings and four-way movement icon (2026-09-25)

Version 0.3.2 shows channel name + colored circle + UP/DOWN/UNKNOWN centered above compact graphs.
The small top-right circle remains in BOTH compact and full modes. Traffic movement uses a static
four-way arrows icon in edit mode with an accessible Move <channel> label; no repeated drag text.
The handle sits beside the compact heading, preserving heading space and graph coordinates.
Requirements and both HTML references updated. Typecheck/lint, 35 unit tests and production build passed.
Both reference smoke checks and all four targeted browser scenarios passed. Browser validation covers compact/full indicators, saved visibility
and four-way icon movement at multiple zoom levels. Changes local, not pushed; owner review pending.

### Consistent component movement (2026-09-25)

Version 0.3.3 shares one four-way movement handle for routers and traffic in compact/full modes.
The same 22 px handle sits above/right of each router or graph. Bodies select on click but do not drag;
handles alone begin movement. Existing zoom compensation, pointer capture/cancel, connection routing
and view-mode locking remain shared. Connections follow routers and have no independent position.
Verification: typecheck/lint, 35 unit tests and build passed. All seven layout/traffic browser scenarios
passed, including body non-movement and identical handle movement for both types at six zoom levels,
connection routing, resize, save/reload and discard. Diagram-reference smoke check passed.
Changes committed locally, not pushed; owner validation pending.
