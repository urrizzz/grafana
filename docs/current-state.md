# Current development state

Last updated: 2026-09-25. Published baseline: `feb4ed4` on `origin/main` includes M1 and the Network Traffic Map rename (`7523401`), plus the Show interface details requirement. Push verified on 2026-09-25. Earlier local/uncommitted notes below are historical.
This document records verified implementation state, not intended behavior. Follow the
[implementation plan](implementation-plan.md) for the work sequence and [development guide](development.md)
for commands/environment. Update this document with every meaningful development increment.

## Current position

**M1 is complete and owner-validated, including zoom and notification refinements. M2 is next.**
New requirement: per-block Show interface details, with an internal status circle when hidden, is planned
for M3/M4 and is not implemented in version 0.1.5 or the HTML mockups.
The real Grafana plugin now edits saved routers, traffic placeholders and connections. Metric discovery,
traffic bars and historical hover are not implemented. Use [M1 validation](m1-validation.md) for review.
The running local version is **0.1.5**. Dropdowns are confirmed fixed by the owner. Layout editing now
starts automatically in Grafana's panel editor; dashboard view/grid editing remain read-only. Owner
confirmed the four editing-mode checks, router-position persistence after Save/reload, and Discard restoring a moved router; remaining original layout checks 2-11 are now owner-confirmed. Owner confirmed the added zoom levels and compact notification work. Next implementation milestone: M2 returned-data adapter.

| Milestone | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 Foundation | Complete (local baseline) | Build/test tooling, CI definitions and unsigned packaging; remote CI unverified |
| M1 Diagram model/editor | Complete; owner-validated | 11 unit checks and five browser scenarios passed across the suite and targeted rerun; see validation checklist |
| M2 Frame adapter | Not started | src/data/ boundary only; fixture fields are manual text for now |
| M3 Traffic renderer | Not started | Traffic placeholders show UNKNOWN/dashes; no live plots |
| M4 Integrated diagram | Not started | Depends on M2/M3 |
| M5 Backend/quality audit | Not started | Synthetic metrics exist separately |
| M6 Distribution | Deferred | Organization, permanent ID, license and route undecided |

## Implemented assets

| Area | Current implementation |
| --- | --- |
| Panel registration | [src/module.ts](../src/module.ts), provisional ID urrizzz-interfacemap-panel, display name Network Traffic Map |
| Runtime UI | [InterfaceMapPanel.tsx](../src/components/InterfaceMapPanel.tsx) follows Grafana panel-editor mode automatically; inspector, zoom, dragging, proportional placeholder resize and connections |
| Saved options | [src/types.ts](../src/types.ts): schema-1 routers, traffic and connections; legacy empty options supported |
| Build | TypeScript/React scaffold, Grafana packages 13.2.2, npm lockfile, lint/unit/build commands |
| Local Grafana | [Compose](../docker-compose.yaml), Enterprise 13.2.2 on loopback port 3001, 512 MB/one CPU limit |
| Provisioning | Editable development dashboard with empty layout; Load fixture layout seeds two routers/one traffic/one connection; no datasource queries |
| Unit check | 11 unit tests: metadata/provisioning, saved-option validation, safe removal, independent duplication and routing |
| Browser check | Expanded browser suite for legacy options, editing, pointer/zoom, save/reload and native panel duplication |
| CI | GitHub workflow defines build, mock tests and browser smoke test; remote run status unverified |
| Packaging | Manual unsigned artifact workflow and local ZIP/checksum script; no release/signing automation |
| Mock metrics | Python exporter/history tools and five tests; separate from the panel runtime |
| Design references | Accepted traffic wireframe and diagram mockup, including hover and automatic connection-side selection |

## Confirmed direction to preserve

Grafana's normal query editor configures the datasource and one or more queries for all needed routers and
channels. Traffic elements select from those returned results. The panel must be datasource-independent,
with configurable identity and result-role mappings; instance/ifName are defaults. There is no planned
VictoriaMetrics-specific query coordinator or per-element query execution. VictoriaMetrics remains the
first deployment example. Queries return five-minute rates in bit/s; the renderer does not rate them again.

A missing selected channel stays in place with UNKNOWN/no data. The graph is natively 120 x 70 with
metadata on its right. Status-colored borders, blue/purple directions, historical outage segments and
hover follow the accepted references. Connections adjust sides while routers move in the implemented editor. The traffic styling and data
behavior above remain requirements for M2/M3. See [decisions](decisions.md) for the full record.

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

Acceptance status: M1 addresses the layout portions of AC-22, 39-45 and 52. AC-39 uses fixture identity fields,
not returned-data pickers yet; AC-43/52 do not yet cover data mappings. AC-44's data-isolation portion awaits
M2/M4. Traffic, hover, real query behavior and performance criteria remain pending. No complete-product
readiness is claimed from the layout tests.

## Open questions and limits

| Item | Impact | When to resolve |
| --- | --- | --- |
| Exact returned frame layouts and metadata joins | Needed for robust role/identity mapping; use generic fixtures now | M2, confirm with real backend in M5 |
| Status freshness and sample-coverage evidence | Cannot infer source quality from evaluated values alone | M2 contract/fixtures and M5 query examples |
| Sanitized port/tunnel samples and VictoriaMetrics plugin version | Needed to verify production-shaped integration | M5; not a blocker to M1 |
| Long metadata fitting | Router labels truncate with a title; full traffic information fitting remains for rendering work | M3 |
| Practical component-count/performance limits | Not measured in the real plugin | M5 |
| Dependency peer/deprecation warnings | Known from install; shell works, broader UI usage unverified | Reassess when introducing relevant UI components |
| Grafana Cloud organization and permanent ID | Owner has no Cloud account; provisional ID accepted for local work | Before signing/publication |
| Project license and distribution route | Package currently private/UNLICENSED; no signing token configured | M6 |

There is no known blocker to starting M2 after the M1 handoff. Unknown backend details do not justify hardcoding the datasource.
No production credentials are required for fixture-based implementation.

## Next concrete work

Owner: follow [M1 validation](m1-validation.md), focusing on movement, connection sides, resize, safe removal,
and save/reload. UNKNOWN/dashes and manual fixture identities are intentional at this stage.

Development: M2 starts with normalized channel/result-role types and a PanelData adapter over synthetic
Grafana frames. Replace fixture text selection with result-driven router/channel choices and configurable
mappings. Do not introduce per-element fetching. Resolve owner-reported M1 issues as part of the handoff.

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
