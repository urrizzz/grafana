# Decisions and remaining technical checks

## Confirmed during the requirements interview

| Topic | Decision |
| --- | --- |
| Grafana deployment | Grafana cannot be modified; no core patches, custom Grafana builds or runtime bundle modifications |
| Development identity | Network Traffic Map; provisional ID urrizzz-interfacemap-panel, to be confirmed against a future Grafana Cloud organization |
| Cloud account | Owner has no account yet; local unsigned development proceeds without one; signing/publication deferred |
| License | No project license selected; package marked UNLICENSED and private to prevent npm publication |
| Repository structure | Standard root panel scaffold, .config tooling, src, tests, provisioning, dev mocks and preserved docs/assets |
| Target | Grafana 13.2.2 |
| Data path | Current deployment: Prometheus to VictoriaMetrics; visualization accepts compatible results from any Grafana datasource |
| Query ownership | Datasource and one or more queries configured at diagram-panel level in Grafana; queries return all needed routers/channels; no plugin-generated or per-element requests |
| Channel discovery | Each traffic element selects from returned routers/channels, with configurable identity mappings defaulting to instance/ifName |
| Missing selection | Keep the element and saved identity; show UNKNOWN/no data and current dashes; never substitute another channel |
| Collection | Every 60 seconds |
| Rates | Five-minute average bit/s for bars and central numbers, with automatic decimal units |
| Capacity | ifHighSpeed, displayed in the right-hand information block |
| Selection | Fixed instance/ifName values and dashboard variables |
| Placement | One custom diagram panel with free placement of routers, traffic elements, and connections; Grafana core unmodified |
| Connection routing | Router connections follow movement continuously and automatically choose the appropriate box sides; bends stay outside endpoint boxes and attachment survives zoom/reload |
| Multiple channels | Independent router/channel settings for every traffic display in the same custom diagram panel |
| Size | Primary traffic area 120 x 70 CSS pixels; design readable text at this size, then scale traffic proportionally upward |
| Compactness | Preserve layout and alignment at very small sizes; avoid fixed-size text crowding the component |
| Author experience | Ordinary settings only; no dashboard-author scripts or manual font retuning per size |
| Time and refresh | Dashboard range and refresh; usually 12-24 hours |
| Router metadata | instance and name are router labels; hidden by default, configurable |
| Channel metadata | ifName, ifAlias, ifDescr shown by default in an information block to the right, outside the traffic area |
| Configuration | Source metric/label names and identity-field visibility can be changed |
| Standard defaults | ifOperStatus, ifHighSpeed, ifHCInOctets, ifHCOutOctets, and standard identity names |
| Plot | Clearly visible IN blue and OUT purple bars; current numbers match direction colors with readable contrast |
| Axis | Shared symmetric autoscale from visible traffic, separate from capacity |
| Current values | Center of each half; five-minute averages ending at dashboard range end |
| Traffic border | Graph rectangle matches range-end status marker: green UP, red DOWN, gray UNKNOWN; independent of historical red outage segments |
| UP | Green circle and UP in the right-hand information block |
| DOWN | Red circle and DOWN in the right-hand information block, historical DOWN segments only, retained history, central dashes |
| UNKNOWN | Gray circle and UNKNOWN in right-hand block for missing/stale status, retained history, central dashes |
| Outage history | Red center-line segments only where observed status was DOWN, even if the channel has since recovered; gaps/unknown never imply DOWN |
| Header order | In the right-hand block: channel name, colored circle, status word, on one line (for example TUNNEL01 [circle] UP); existing colors retained |
| Interaction | Hover adds a vertical time cursor plus timestamp/interval and IN/OUT average rates; current information remains directly visible |
| Design reference | Diagram mockup accepted for layout/editor workflow; original interactive wireframe accepted for component visuals; source and screenshots tracked in Git; see [design-reference.md](design-reference.md) |
| Repository | GitHub repository urrizzz/grafana; owner authorized committing and pushing these updates |

These decisions supersede the earlier VictoriaMetrics-specific query coordinator and no-manual-query proposal,
built-in Canvas placement requirement, fixed Grafana datasource choice,
hidden history while DOWN/UNKNOWN, ifDescr-only heading, capacity overrides/fallbacks. The later hover requirement supersedes the earlier no-tooltip decision.

## Proposed engineering defaults, not confirmed requirements

- Single-valued dashboard variables; explicit errors for All/multiselect or ambiguous identity.
- Complete UTC-aligned five-minute history buckets and a separate range-end current query.
- Four samples per five-minute window and 180-second status freshness threshold, pending backend tests.
- Raw IF-MIB non-UP states 2/3/5/6/7 mapped to DOWN; code 4/invalid/missing to UNKNOWN.
- Missing enabled metadata shown as a dash; missing capacity shown as unknown.
- Rounded common axis with modest headroom; the implementation must honor the confirmed proportional-scaling requirement.

120 x 70 is the confirmed primary traffic size, excluding the right-hand block. No minimum below it,
fixed information-block width or seven-day maximum range has been approved. The accepted wireframe
provides the starting theme colors and typography.
The previous resize-hint fallback is superseded as the normal response to shrinking the component.
Very small text may become difficult to read, but shrinking must preserve composition rather than crowd it.

## Technical checks before implementation

1. **Delivery decision resolved:** the owner approved our own installable diagram panel containing routers,
   traffic elements and connections. No Grafana core modifications. Verify normal panel lifecycle and saved
   options on 13.2.2. See [architecture](architecture.md).

2. **Exported data shape:** inspect full labels and channel metadata for one port and one tunnel; names alone
   do not establish whether metadata is stored as labels or separate series, or how joins remain unique.
3. **Returned-data contract:** prove configurable frame/label mappings, channel discovery and element isolation
   with generic fixtures, then validate query steps/rates/freshness using the current VictoriaMetrics datasource.
4. **Publication:** local unsigned packaging is available. Confirm the provisional ID against a future
   Grafana Cloud organization, choose a license, and decide signing/delivery before public release.

The product interview is sufficient to update the design. Remaining items are concrete technical evidence
or delivery decisions; they do not reopen the approved custom diagram approach.

The split layout supersedes metadata/status/capacity inside the graph and whole-card downscaling from a large base.

## M1 engineering choices (2026-09-25)

- Keep schema version 1 compatible with the original schemaVersion-only empty options. Reject unsupported
  versions and malformed layouts without overwriting them. Saved records have stable, unique IDs.
- Block router removal until dependent traffic and connections are removed or reassigned.
- Duplicate only the selected router/traffic element, offset it and select the copy; retain its channel
  binding but do not silently copy connections or dependent elements.
- Suppress connections between overlapping/touching boxes until a clear corridor exists. Route using fixed
  actual router bounds (legacy default 150x64; optional saved dimensions since 0.3.5); unrelated obstacle avoidance remains out of scope.
- M1 traffic plot resize range is 120-360 px, preserving 120:70 proportions; this is an editor bound, not a
  final product maximum. Fixture identities are editable text until result-driven selection in M2/M4.

## 2026-09-25: Follow Grafana panel editing

Remove the independent layout toggle. Only the active Grafana panel editor exposes layout mutations.
Dashboard view and dashboard grid editing remain read-only. Back retains pending edits, Save persists
through Grafana, and Discard restores the prior panel. Zoom remains available while viewing.
The HTML mockup's standalone edit toggle is superseded for plugin integration.

## M1 owner feedback (2026-09-25)

Channel name, alias and description come from the router's returned metric data (defaults ifName,
ifAlias, ifDescr), not manual user entry in the finished plugin. Configure metric/query roles and
field/label mappings at panel level; elements select a returned router/channel. Manual fields in M1
are fixture-only scaffolding to be replaced during M2/M4. The plugin does not query routers directly.

Offer 25%, 50%, 75%, 100%, 125% and 150% zoom. Failed editor actions use a compact themed overlay inside the layout, with an explicit Dismiss action.
It must not shift or shrink the diagram; its width is at most 340 px and height at most 110 px (scroll longer text). Clear it after successful changes or element selection;
do not leave old errors in the persistent save hint. Avoid a timer that could hide unread explanations.

## 2026-09-25: Optional interface details on each traffic block

Historical decision (superseded: compact is the default since 0.3.1): use **Show interface details**, enabled by default, to hide the entire side-information block and reclaim
its width when disabled. Move the status indicator to a circle inside the graph top-right (green UP,
red DOWN, gray UNKNOWN), keeping the graph size, current values, history and status border unchanged.
Persist independently per element, preserve hidden field preferences, and default old layouts to visible.
See product-spec.md and AC-53 through AC-55. Requirement only; implementation is planned for M3/M4.

## 2026-09-25: Configuration-first query presets

Owner accepted editable standard IF-MIB presets and requested moving as much setup as possible into
configuration. Panel-level settings cover source metric/label names and shared filters; element settings
select router/channel and display options. Preset generation must produce normal editable Grafana queries
and matching adapter mappings, with explicit preview/apply and preservation of manual edits. No automatic
query replacement, Grafana core modifications or plugin-owned datasource requests. Direct query installation
requires API feasibility verification; an importable configured starter dashboard is the fallback route.
See the configuration-first section in product-spec.md. Not implemented in 0.2.0; add to M4 setup work.

## M3 compact default and outage visibility (2026-09-25)

Owner requested removal of the small 5m/range-end caption. Compact mode is now the default for unset
blocks, with the channel name centered above the unchanged graph footprint and the status circle inside
top-right. Preserve explicitly saved detail choices. Red outage segments retain their real timestamps;
use stronger thickness for visibility and report observed outage start/end times on hover. This supersedes
earlier default-on detail and visible current-window-caption decisions.

## Selection handles and both development PCs (2026-09-25; hover visibility superseded below)

Owner requested matching handle placement and selection-only visibility. Move is above/right and resize
below/right, in one column with equal two-pixel vertical clearance. Both appear only on the selected
router/traffic element in the panel editor; body clicks select and background clicks deselect.
Both Owner and Yuri PCs remain supported via the documented machine profiles and shared deployment
scripts. Preserve the Yuri PC EFS rules and legacy container database; no automatic recreation/migration.

## Hover discoverability (2026-09-25; handle visibility superseded below)

Owner accepted a subtle outline on hover in edit mode. Keep move/resize controls selection-only,
persist selection after pointer leave, and keep dashboard view free of editing hover outlines.

## Hover handle clarification (2026-09-25)

Owner clarified that the hover hint must include subtle move/resize buttons, not only an outline.
Use 50% opacity on unselected hovered elements and full opacity on selection. Both hover buttons can
be dragged directly, selecting the element. This supersedes selection-only handle visibility.

## M3 owner acceptance (2026-09-25)

Owner explicitly accepted M3 at 0.3.8 and authorized reconciling all requirements/current state and pushing
the accumulated code and documentation. The final interaction is faint (50%) controls on hover, full
controls on selection, direct dragging from either hover control, and mirrored move/resize placement.
Both development PCs remain supported with their own tool paths and storage constraints. M4 query
presets/lifecycle is next; M5 real-backend/performance and M6 distribution remain uncompleted.
