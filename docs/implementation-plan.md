# Implementation plan

Working plan for Network Traffic Map. Established 2026-09-25 from the approved requirements.
Read with [current state](current-state.md) at the start of each development task.

## Authority and scope

The [product specification](product-spec.md), [decisions](decisions.md), [metrics contract](metrics-contract.md)
and [acceptance criteria](acceptance-criteria.md) define required behavior. This document defines the work
sequence and completion gates. Current-state.md records actual progress and evidence. If a new user decision
changes scope, update the affected requirements and this plan before relying on an older milestone.

Use both [accepted references](design-reference.md): the diagram mockup for arrangement/editor behavior,
and the traffic wireframe for rendering. They demonstrate intended behavior, not completed plugin features.
Build one installable panel for unmodified Grafana 13.2.2. Keep these constraints throughout development:

- Grafana owns datasource selection, panel-level queries, variables, time range and refresh. Query results
  contain all needed routers/channels; elements select from returned data and never issue their own queries.
- Configurable result roles and identity mappings; instance/ifName and standard IF-MIB names are defaults,
  not fixed datasource dependencies. Queries supply five-minute bit/s rates; do not differentiate them again.
- A native 120 x 70 traffic graph, separately readable channel information on its right, and the approved
  colors, status border, retained history, outage segments and hover behavior.
- Router connections choose facing sides and adjust during movement. Full obstacle avoidance around
  unrelated elements, automatic topology discovery and a complete Canvas clone are outside current scope.
- Saved diagram configuration belongs in dashboard panel options; browser storage remains mockup-only.

## Sequence and dependencies

| Milestone | Depends on | Deliverable | Main acceptance coverage |
| --- | --- | --- | --- |
| M0 Foundation | None | Standard plugin shell, build/test tools, provisioned smoke dashboard | AC-01 partially; foundation only |
| M1 Diagram model and editor | M0 | Versioned options, routers/traffic placeholders, movement, resize, connections, save/reload | AC-22, 39-45, 52 layout portion |
| M2 Returned-data adapter | M1 model | Frame mappings, channel index, selections, normalized traffic/state/quality | AC-02-09, 17-20, 23-24, 26, 46-52 |
| M3 Traffic component | M2 normalized model | Native-size plot, information block, status, axes and hover | AC-10-21, 27-38, 53-54 |
| M4 Integrated diagram | M1-M3 | Actual mapped traffic in independently configurable saved elements | AC-02-07, 22-23, 26, 31, 39-59 |
| M5 Backend and quality validation | M4 | Reproducible live demo and complete functional/performance evidence | AC-01-59, especially 24-25 |
| M6 Distribution readiness | M5 and publishing decisions | Versioned validated artifact, then selected signing/publication route | Release checks in publishing guide |

Work in this order by default. Production-shaped sample gathering can proceed at any time; missing samples
must not block fixture-based editor work. A visual demo alone does not complete a milestone. Record deviations
and their reason in current-state.md. These are completion gates, not time estimates or extra approval steps.

## M0 - Foundation

The scaffold, lockfile, CI definition, local Compose environment and manual unsigned packaging exist.
Keep this foundation working as features land. Historical local validation is recorded in current-state.md;
a committed CI workflow is not evidence that a remote CI run passed.

## M1 - Diagram model and editor

Implementation and owner validation are complete, including zoom and warning refinements. M2 is owner-accepted; M3 implementation is awaiting owner validation. See [current state](current-state.md) for verification and
[M1 validation](m1-validation.md) for the owner checklist; do not infer full traffic support from this milestone.

1. Extend src/types.ts with versioned router, traffic and connection records, stable IDs, geometry and mappings.
   Handle existing schemaVersion-only options as an empty diagram. Define validation and future migration entry points.
2. Add pure diagram operations in src/diagram/: add/update/remove, duplicate and reference validation.
   Choose and document safe dependent-element behavior on router removal; never silently rebind a channel.
3. Follow Grafana panel editor navigation automatically: edit only the active panel; dashboard view and grid editing remain read-only. No separate layout toggle. Build ordinary option editors. Use fixture identities initially, explicitly labeled
   as development data. Router/traffic pickers become result-driven in M2/M4.
4. Implement movement, proportional plot resize and connections. Derive endpoints from current box bounds;
   switch left/right/top/bottom sides with bends outside endpoint boxes. Preserve zoom/scroll coordinates.
5. Save through Grafana panel options. Keep selection/drag/hover state transient and separate from saved data.

Completion evidence: pure geometry/reference tests; browser create/move/resize/connect/delete checks;
save and reload a real Grafana dashboard; duplicate its panel and confirm independent runtime state.
Check vertical, reversed and diagonal connections, overlap handling, zoom, and edit/view transitions.
Do not mark production traffic support complete because placeholders work.

## M2 - Returned-data adapter and selection

Implemented locally in 0.2.0 and owner-accepted on 2026-09-25. [M2 validation](m2-validation.md) remains
the regression guide. M3 implementation follows below.
Production VictoriaMetrics frame/quality evidence remains an M5 check, not a claim made by synthetic tests.

1. Define normalized channel identity, history/current rates, metadata, capacity, status and quality types.
   Specify supported frame shapes and document unsupported/ambiguous inputs explicitly.
2. Implement src/data/ adapters from PanelData. Map query refIds, fields and labels to roles; preserve
   identity keys across rates, metadata and status. Convert ifHighSpeed units once, without re-rating traffic.
3. Derive router/channel choices from the union of returned identities, including metadata/status-only channels.
   Scope channel choices by router. Support mapped names and optional single-valued selection variables.
   Replace fixture metadata entry with returned ifName/ifAlias/ifDescr; configure metric/query and label/field mappings at panel level.
4. Handle loading, errors, missing directions, coarse sampling, unknown freshness and ambiguous joins.
   Missing selections retain layout and identity with UNKNOWN/no data. Never reuse another selection's data.
5. Normalize timestamped outage intervals and current-at-range-end values using the metrics contract.
   Distinguish source timestamps from evaluation timestamps; flag missing evidence rather than fabricate it.

Completion evidence: fixtures for multiple routers with the same ifName, alternate label/field names,
query aliases, missing/duplicate results, non-aligned historical range ends, stale samples and recovered outages.
Verify selection only filters received frames and does not create network queries. VictoriaMetrics-specific
query examples belong in documentation/provisioning, not the adapter implementation.

## M3 - Compact traffic rendering

Implemented locally in 0.3.5; owner validation pending. Follow [M3 validation](m3-validation.md) and
[current state](current-state.md) for actual verification evidence. M4 query presets are the next implementation step after acceptance.

1. Implement the plot and right-hand information block using the normalized model, independently of datasource code.
2. Render blue IN above and purple OUT below zero, a shared symmetric scale, decimal units and readable
   matching current values. Build at 120 x 70 first; scale the plot upward without shrinking external text.
3. Implement green/red/gray borders and name-then-status heading; preserve history in DOWN/UNKNOWN and use
   current dashes. Draw red center segments only over observed historical DOWN intervals.
4. Add time-bucket hover, a vertical cursor and readable external time/IN/OUT tooltip; keep central values unchanged.
5. Support configured metadata visibility, long labels and light/dark themes without overlapping content.
6. Add per-block Show interface details (default false); when off collapse side-block space and render
   a status circle inside the graph top-right. Update both visual reference variants and validate all three
   statuses at 120 x 70 with no current-value overlap (AC-53/54).

Completion evidence: unit checks for units/scales/status intervals and browser comparisons with both accepted
references at native size, 150% and 200%, all states, gaps, zero traffic, long labels and hover after resize.
Use actual normalized sample values for hover; never infer them from rendered bar geometry.

## M4 - Integrated diagram and dashboard lifecycle

Replace fixture placeholders with mapped traffic components. Connect result-driven router/channel settings,
role mappings, field visibility and saved options to the editor. Persist per-element Show interface details,
default older layouts to true, and verify independent duplication and restoration (AC-55). Persist query definitions through Grafana's
normal query editor, not duplicated plugin options. Preserve component identity during refresh and changes.

Completion evidence: a provisioned multi-router dashboard; save/reload, panel duplication, variable/range
changes, rapid selection changes, datasource/query errors and channel disappearance/reappearance. Verify
no cross-channel data, no per-element fetching, and hover does not prevent editing or cause accidental dragging.
Confirm current values are evaluated at the selected range end, not implicitly at wall-clock now.

### M4 configuration-first setup deliverable

Add editable IF-MIB presets and panel-level metric/label/filter configuration (AC-56 through AC-59).
First verify supported Grafana APIs for installing query targets; if unavailable use an importable
configured starter dashboard/panel, keeping Grafana unchanged. Generate normal queries and matching
adapter mappings with standard defaults; provide preview and explicit apply/regenerate. Preserve manual
query edits and explain unsupported preset datasource formats. The visualization adapter stays generic.
Test escaping, aliases, variable filters, historical range end, query persistence and duplicated-panel
independence. Actual VictoriaMetrics rate/quality semantics remain M5 verification. This setup feature
is not part of the already implemented M2 adapter and does not replace M3 rendering as the next milestone.

## M5 - Real backend, performance and acceptance audit

Use synthetic IF-MIB data with a local query backend and VictoriaMetrics datasource as the first real example.
Provide repeatable query/provisioning examples for rates, status history/current, capacity and metadata.
Record the datasource version and actual returned shape. Add sanitized production port/tunnel samples when available.
Validate 300-second rate history and 60-second status resolution independent of small graph width.

Test 12-hour and 24-hour views. Proposed measurement sets are 10 and 50 components, not promised capacity:
record browser/render latency, refresh behavior and memory on the 16 GB machine, then document supported
practical limits. Keep the established WSL cap and one browser worker; stop disposable services after checks.
Do not silently coarsen data to make the chart faster. Resolve acceptance failures before calling the MVP done.

Completion evidence: every AC-01 through AC-59 has a result or explicit unresolved entry in current-state.md;
reference screenshots, repeatable live-data setup, relevant tests and known limitations are documented.
Unresolved required acceptance criteria prevent marking this milestone complete.

## M6 - Distribution readiness

Follow [repository and publishing](repository-and-publishing.md). Confirm the future Grafana organization
slug/plugin ID, project license and private/public distribution route. Local unsigned development needs no
Cloud account. Check version/compatibility metadata, documentation, screenshots, package validation and
checksums. Add release/signing automation only for the selected route; keep tokens in secrets.
A GitHub artifact or release is distinct from Grafana catalog approval. No publication is implied by this plan.

## Working procedure and definition of done

At task start, read current-state.md, confirm source/branch state, choose the next incomplete milestone and
identify the smallest useful deliverable. Consult the relevant ACs before implementation. Use the environment
and EFS instructions in [development.md](development.md); requirements take precedence over historical research.

For each completed increment, record what changed, affected ACs, test commands/results and remaining gaps
in current-state.md. Update requirements if the user changed behavior. Update this plan only when sequence,
scope or completion gates change. Keep documentation with the corresponding code change.

An increment is done when its behavior is implemented, relevant checks pass, docs match it, and failures or
limitations are explicit. Run npm run check for runtime changes and focused browser tests for interaction
changes; run mock tests when their behavior changes. Documentation-only edits need link/consistency and diff
checks, not the full runtime suite. Record verification dates and distinguish local from remote CI evidence.
Do not mark a milestone complete from planned work or mockup behavior. Use the next concrete action rather
than vague percentage-complete estimates when handing off development.

### Status and movement refinement (2026-09-25)

Compact heading: channel name followed by colored circle and UP/DOWN/UNKNOWN, centered above the graph.
Keep the small status circle inside the top-right corner in BOTH compact and full modes. Full mode keeps
its existing side heading. In the editor, use a static four-way arrows movement icon, not a text drag label
or animated image. Preserve an accessible Move <channel> label. This supersedes earlier heading-only and
compact-only corner-indicator wording. Verify both indicators and movement at different zoom levels.

### Consistent movement (2026-09-25)

In panel edit mode, routers and traffic blocks use the same four-way arrow handle above the top-right
edge of the router/graph, in both compact and full modes. Click a body to select; drag only its handle.
Body/label/graph gestures must not move elements. View mode has no handles. Connections automatically
follow their routers rather than being independently draggable. Validate both element types at all zooms.
This supersedes earlier whole-router dragging and mode-specific handle placement.

### Router sizing and resize handles (2026-09-25)

Selected routers and traffic blocks expose a 22 px diagonal-arrow resize button styled like the move
button, beside the bottom-right corner of the router/graph. Router width and height resize independently
within 120-600 x 48-320 px. Old layouts default to 150 x 64; optional dimensions persist with Save,
reload and duplication. Top-left position stays fixed. Connections and diagram bounds use current router
sizes. Traffic retains its proportional 120:70 shape and 120-360 px width. Handles are edit-mode only.
Validate router resizing at different zooms, live connector attachment and Save/reload.
