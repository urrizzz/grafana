# M3 compact traffic validation

Running version: 0.3.5 on Grafana 13.2.2, port 3001. Owner validation pending.
Open your [existing data dashboard](http://localhost:3001/d/network-map-data-dev) and reload the page.
Its saved layout, queries and selections are preserved. Keep the fixed fixture time range and the
Network Map Mock Frames datasource; switching datasources can replace queries (see M2 guide).
For a repeatable UP/DOWN comparison, the browser tests also create
[M3 graph checks](http://localhost:3001/d/network-map-m3-graphs) independently of your dashboard.

1. At diagram zoom 100%, check the 120 x 70 graph: bright blue incoming above zero, purple outgoing
   below; readable matching current values, positive unit labels and identical IN/OUT scale limits.
2. Hover: vertical line follows five-minute buckets, tooltip shows the interval and IN/OUT rates outside
   the graph. Central values stay fixed. Moving away or dragging clears the tooltip.
3. DOWN has a red border and current dashes but retains bars; red center segments cover only known
   historical outages (hover an outage to see its start/end times). UNKNOWN has a gray border, dashes and retained available history.
4. Compact mode is the default: the channel name, colored circle and status are centered above the graph, with no tiny 5m caption.
   Panel menu > Edit, select traffic by its Move handle. Enable then disable Show interface details: the side block
   and its space disappear; the status circle remains inside the graph's top-right in both modes. Graph size and location
   stay fixed. Restore details and verify the selected Visible details fields are remembered.
5. Try 180 and 240 px widths. Hover remains readable and accurate after resizing or zooming. Return to
   120 px to judge the main use case at normal browser zoom.
6. Back > Save > reload. Width, details visibility and field choices should remain. A duplicated element
   can have different visibility without changing the original. Dashboard view remains read-only.
7. Check light/dark themes and your longest channel descriptions. Side text should wrap without entering
   the graph; the status circle must not overlap central values in compact mode.

Report failures by number. These checks accept M3 visuals only; configuration-first IF-MIB query presets
are planned for M4. Production VictoriaMetrics behavior and 10/50-element performance remain M5 work.
The renderer consumes normalized bit/s rates; it does not query a datasource or calculate counter rates.
Axis abbreviations b/k/M/G are bit/s, kbit/s, Mbit/s and Gbit/s. Empty/invalid values use --, not zero.

## Corrected TestData history (2026-09-25)

The fixed 00:00-12:00 UTC demo has a recovered outage from 00:50-01:00 on all three traffic channels.
BRANCH-01 Tunnel10 has another outage from 11:30 through 12:00 and is currently DOWN. All other traffic
channels recover to UP. Incoming/outgoing rates use separate deterministic irregular minute samples,
zero during outages, averaged over the preceding five minutes. Instant rates equal the final history
window. A window ending exactly at outage start still describes the preceding UP traffic; a window
wholly inside an outage is zero. Status is sampled each minute and no longer stays DOWN for the whole
range on the branch channel. Tunnel99 remains metadata-only/UNKNOWN.

These are synthetic Grafana frames, not verification of VictoriaMetrics counter-rate behavior.

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
