# Custom diagram panel architecture

## Agreed host and workflow

Implement an ordinary installable Grafana panel plugin for Grafana 13.2.2. It owns a free-placement diagram
containing routers, connections, and compact traffic elements. Grafana core remains unmodified: no source
patches, runtime injections, or custom Grafana builds. This approved approach supersedes built-in Canvas
placement. The [source investigation](implementation-investigation.md) remains evidence for that decision.

The author adds our panel to a dashboard, adds routers and selects their instances, then adds desired
ports/tunnels. Each traffic element references a router and its own ifName. The author moves elements,
resizes traffic graphs, configures connections, and saves the dashboard. Viewing mode hides editing controls.
The outer panel follows Grafana dashboard layout; element coordinates are internal to our diagram.

Use the [diagram mockup](assets/diagram-panel-mockup.html) for layout/editor behavior and the
[traffic wireframe](assets/scalable-wireframe.html) for component visuals. Neither is implemented plugin code.

## Options and persistence

Proposed TypeScript options use a schema version, stable element IDs, router records (instance selector and
label), traffic records (router ID, ifName selector, mappings, visibility, graph size and position), and
connections with explicit endpoint IDs. Derive connector geometry from current router bounds, not saved
line coordinates. Choose facing left/right or top/bottom edges according to the available separation;
recompute while dragging, after bounds/endpoint changes, and on reload, using diagram coordinates.
Keep orthogonal bends outside the two endpoint boxes and attachment stable under zoom/scroll. Persist diagram configuration through Grafana panel options and
normal dashboard saving. Browser localStorage is only the mockup's preview mechanism.

Keep query results and temporary hover/drag/selection state out of saved options. Validate references;
router removal must not silently rebind traffic or connections. Define safe handling of dependent elements
in the editor. Duplicating a dashboard panel must preserve its layout and isolate runtime state.

## Query ownership

The plugin is a datasource-independent visualization. The author chooses a datasource in Grafana's normal
panel query editor and configures one or more queries returning all required routers/channels. Grafana
executes the queries, resolves query variables, handles authentication and cancellation, and delivers
PanelData frames on the dashboard time range and refresh lifecycle. The plugin consumes those results;
it does not generate datasource-specific queries, run per-element requests, or own a polling timer.
This supersedes the earlier VictoriaMetrics-specific query coordinator proposal.

VictoriaMetrics is the owner's current backend, with Prometheus collecting IF-MIB every 60 seconds.
Other datasources can be used when queries return the documented fields, labels, units and timestamps.
Backend query syntax and counter-rate calculation belong to query configuration, not the renderer.

A frame adapter maps query reference IDs/fields/labels into logical roles, then indexes the union of
returned router/channel identities. Router and channel pickers use that index; channel choices are scoped
to the selected router. Default identity labels are instance and ifName, both configurable. Preserve any
additional identity keys needed to distinguish sites/jobs. Resolve optional single-valued element variables
against the returned data; selecting another element/channel filters results without fetching data.

Store selections, mappings and layout with panel options, and datasource/query definitions through normal
Grafana dashboard configuration. A selected channel absent from the results remains in place as UNKNOWN
with no-data indication and current dashes. Do not substitute another channel. Clear history from an old
selection; any retained same-channel history must be visibly stale and scoped to the current range.

Map five-minute IN/OUT rates (already in bit/s), range-end rates, timestamped operational status and
capacity/metadata separately. Query configuration must preserve five-minute traffic and collection-resolution
status history regardless of graph width. If returned data is too coarse, lacks required roles, or does not
support freshness evidence, report the limitation rather than inventing samples or valid current values.
Validate the contract against VictoriaMetrics and datasource-independent frame fixtures.

## Implementation boundaries

| Area | Responsibility |
| --- | --- |
| Panel entry | Standard PanelPlugin registration and Grafana lifecycle |
| Diagram editor | Router/traffic configuration, free placement, resize, connections, edit/view mode |
| Saved options | Versioned schema, stable IDs, validation, dashboard persistence |
| Frame adapter and channel index | Consume PanelData, map roles/identity, discover returned routers/channels and isolate element selections |
| Normalization | Rates, metadata, capacity, freshness, errors, historical DOWN intervals |
| Traffic renderer | SVG bars/axes, current values, status border, right-hand information, hover |

The scaffold uses TypeScript/React with Grafana 13.2.2 packages. SVG remains the planned traffic renderer. The root scaffold uses provisional ID `urrizzz-interfacemap-panel` and the development name Interface Map.
No Grafana Cloud account exists yet; local unsigned development proceeds without it. Final identity,
license, signing, and deployment policy remain to be settled before distribution. No Grafana backend plugin
is currently required by the design; backend integration still needs proof.

## Rendering and interaction

Build the traffic graph at native 120 x 70 CSS pixels, then scale it proportionally upward. Keep the channel
information block to its right; it consumes additional space and uses independently readable typography.
Use bright blue IN above zero, purple OUT below, matching readable current numbers, and symmetric autoscale
from visible traffic. The graph border matches range-end status: green UP, red DOWN, gray UNKNOWN.
Historical DOWN intervals alone produce red center-line segments, independently of the current border.

Hover maps pointer coordinates to the selected five-minute bucket and reads normalized data, never inferred
SVG geometry. Render the time/IN/OUT tooltip outside the scaled graph, keep it in view, and clear it on leave
or selection changes. Current values remain at the dashboard range end. Drag/resize controls must coexist
with hover; selection outlines do not replace the status border.

Benchmark multiple independent elements across 12-24 hours, including 288 buckets per direction at 24 hours.
Retain all samples despite subpixel bars at native size. Validate long metadata, light/dark themes, reload,
variable changes and cleanup. A full Canvas clone, automatic topology discovery, and bulk interface import
are not committed scope. Mockup success does not establish live plugin compatibility.
