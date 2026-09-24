# Implementation investigation: Grafana 13.2.2

## Deployment constraint confirmed by owner

**Grafana itself cannot be modified.** Source patches, custom Grafana builds and runtime bundle modifications
are excluded. The source-integrated route below is retained only to explain the technical limitation.
A standalone custom panel is the recommended feasible alternative, but changing the built-in Canvas
placement requirement has not yet been approved.

## Conclusion

The accepted traffic visualization can be implemented as a reusable TypeScript/React renderer.
However, **an ordinary installable Grafana panel plugin has no supported registration route into built-in
Canvas in the exact installation inspected**. Keeping the built-in Canvas requirement calls for adding a
custom element to a maintained Grafana source build, or a future upstream extension mechanism.
This is a source-inspection finding, not a completed custom-element runtime proof.

The earlier uncertainty about where Canvas gets its elements is resolved: it uses internal source lists.
A production delivery decision is still needed. No Grafana core files or running dashboards were changed
by this investigation, and no custom Grafana image was built.

## Evidence from the installed version

Verified `/api/health`: Grafana 13.2.2, commit `1bea008f7e4e858b6824c9e364d608bd4d10b13a`.
The installation includes source under `/usr/share/grafana/public/app/`; these exact files were read.
[Source file hashes](canvas-investigation-evidence.json) record the inspected artifacts without copying
Grafana source into this repository. Paths below are relative to `public/app/`.

| File / location | Observation | Consequence |
| --- | --- | --- |
| `features/canvas/registry.ts:25-43` | Imports built-in element objects and assembles default/advanced arrays into a registry | External panel installation does not register a Canvas element |
| `plugins/panel/canvas/utils.ts:49-55` | Add-item choices are built directly from those arrays | Merely obtaining a registry object and adding an item would not by itself update the picker |
| `features/canvas/runtime/frame.tsx:61` | Saved type IDs resolve through the internal registry, with a not-found fallback | A custom type in dashboard JSON alone does not supply its implementation |
| `features/canvas/element.ts:26-31,87-99` | Per-element config, display component, data preparation and option editor interfaces exist | Concrete internal extension points for a source-integrated element |
| `features/dimensions/context.ts:27` | Data preparation can access PanelData | Full time-series frames can reach the renderer, not just a last-value metric |
| `features/canvas/runtime/scene.tsx:216-221` | Scene exposes and distributes updated panel data | Existing Canvas query lifecycle can drive element updates |
| `plugins/panel/canvas/CanvasPanel.tsx:212-218` | New panel data and option changes update the scene | Hook the adapter into the host lifecycle, not a separate timer |
| `plugins/panel/canvas/editor/element/elementEditor.tsx:99-100` | Calls the selected item's option editor | Ordinary selector/mapping settings can be implemented without user scripts |
| `features/plugins/loader/sharedDependencies.ts` | No Canvas registry exposed in the shared dependency map inspected | Do not rely on an external plugin importing internal Canvas modules |

A recursive scan of installed `public/app` found registry use in the Canvas picker, runtime, utilities
and registry definition; no external registration call was found. The public
[UI extension catalog](https://grafana.com/developers/plugin-tools/reference/ui-extensions-reference/extension-points)
also lists no Canvas-element extension point. This supports the conclusion; it is not a claim that a
private runtime injection hack is impossible. Such a hack is not a supported delivery strategy.

## Delivery choices

| Route | Preserves built-in Canvas? | Result and cost |
| --- | --- | --- |
| Source-integrated Canvas element in a custom Grafana build | Yes | Best match for unchanged requirements; maintain a small patch plus renderer/query integration and validate every upgrade |
| Standalone custom traffic panel | No | Ordinary plugin packaging and settings, easier maintenance; dashboard-grid placement rather than inside Canvas |
| Separate custom topology/Canvas-like panel | No | Free placement inside our own panel; substantially more editor, connection, persistence and accessibility work |
| Request/contribute an upstream extension point | Eventually, if accepted | Could enable a normal external package later; availability and timing cannot be assumed |

**Recommendation under the no-modification constraint:** implement a standalone custom traffic panel if the
owner accepts dashboard placement. Package the accepted renderer, normal settings and query adapter as a
standard panel plugin. The internal Canvas route is ruled out; it must not be implemented as the next step.
Keep the renderer independent so a supported Canvas API could be adopted later if one becomes available.

The local server uses the Enterprise image. Obtaining a complete reproducible source/build matching that
artifact is still a prerequisite; shipped frontend source alone is not a full build checkout. Validate the
chosen OSS/Enterprise distribution and production packaging before committing to a build strategy. Do not
edit hashed/minified bundles in a running container or assume changing shipped TSX files changes the UI.

## Investigated Canvas route (ruled out by deployment constraint)

### 1. Isolated host proof

Acquire the matching source/build inputs and create a separate local image/port; leave the current server
intact. Add `compact-interface-traffic` to Canvas's default element list, backed by a minimal
`CanvasElementItem`. This adds it to both registry resolution and the normal picker.
Prove create, move, resize, configure, duplicate, save, reload and delete using a fixture before wiring queries.
Verify that unknown element types fail clearly if a dashboard is opened in stock Grafana.

### 2. Reusable renderer

Proposed modules:

```text
traffic/
  model.ts              # positive bps values, metadata, quality, status intervals
  normalize.ts          # uniquely match channel, validate frames and timestamps
  intervals.ts          # five-minute buckets and bounded DOWN intervals
  TrafficPlot.tsx       # SVG plot, native 120 x 70, scaled enlargement
  ChannelInfo.tsx       # name + status, alias, description, capacity on right
  HoverInspector.tsx    # readable tooltip outside the scaled SVG
  options.ts            # data source, selectors, source mappings, visibility
canvas-integration/
  compactTraffic.tsx    # internal element descriptor and option editor
  queryCoordinator.ts  # dashboard lifecycle and shared query ownership
```

Use the [accepted wireframe](design-reference.md) as the visual baseline. Implement rendering with SVG
for bars/axes and React text/tooltip layers. No ECharts script editor is needed. Graph geometry starts at
120 x 70; the information block consumes additional width and keeps readable typography.

A composite element containing plot plus information avoids separate blocks drifting to different channel
selections. Its Canvas bounding box must include both blocks; it must not claim the total element is
120 x 70. Expose a graph-size setting and validate how Canvas resize changes it while preserving the
right-hand text. Exact total width/height remains an implementation layout decision.

Keep incoming/outgoing data positive; invert only OUT coordinates. Use a shared observed-traffic scale,
bright bars and matching readable numbers. Draw red intervals from status history, independently of the
range-end badge. Hover maps pointer position to time, reads actual model values, and leaves current values
unchanged. Coordinate hover with Canvas edit/drag gestures; do not capture pointer events needed for editing.

### 3. Query ownership: a real integration task

Canvas normally receives panel-level query results. An element's instance/ifName settings do not automatically
create data-source queries. `prepareData()` is synchronous normalization, not a place to launch polling.

For the no-script workflow, implement a Canvas-level query coordinator for traffic elements. It reads
configured element selectors, generates requests through Grafana's existing VictoriaMetrics data source,
and supplies keyed results to the renderer. It must reuse dashboard range, variables and refresh, preserve
existing non-traffic Canvas queries, cancel obsolete work, deduplicate identical channel requests and clean
up on removal/unmount. A host proof must establish those lifecycle hooks before finalizing this design.

An initial fixture or manually queried spike can validate rendering, but manual query configuration is
not the finished user experience. Query coordination will likely require more source integration than just
one registry entry. No new SNMP collector or Go backend is needed for the visualization itself.

### 4. VictoriaMetrics data contract

Use the `victoriametrics-metrics-datasource` plugin, selected by UID. Actual installed production plugin
version and sanitized metadata labels are still needed; the name alone is not a verified query contract.

Separate request groups:

- **History:** mapped octet counters through `8 * rate(counter[5m])`, aligned complete five-minute buckets.
- **Current:** five-minute average rates evaluated at dashboard range end.
- **Status history:** operational codes with source freshness at 60-second resolution, to locate DOWN intervals.
- **Identity/capacity:** mapped labels/metadata and ifHighSpeed, with unique router/interface joins.

Do not reduce historical status to five-minute averages or infer DOWN from zero traffic. Query lookback can
carry old samples forward, so verify source timestamps before forming red segments. Preserve unknown gaps.
Account for VictoriaMetrics rate/reset semantics with synthetic fixtures rather than assuming Prometheus
implementation details.

A critical compact-panel issue is query resolution: the backend must not use a 120-pixel width as the maximum
sample budget. At 24 hours, request enough points for 288 traffic buckets and 1,440 status intervals (plus
boundary samples). Set explicit step controls and sufficient maxDataPoints separately, then verify actual
returned spacing. The upstream [VictoriaMetrics step calculation](https://github.com/VictoriaMetrics/victoriametrics-datasource/blob/main/pkg/plugin/step.go)
uses both range/maxDataPoints and minimum interval; minimum step alone does not guarantee a fixed step.
The [query type](https://github.com/VictoriaMetrics/victoriametrics-datasource/blob/main/src/types.ts)
provides expression, instant/range and interval options; pin/test the version actually used.

At native width, 288 five-minute bars occupy fewer than 120 plot pixels. Render the time scale honestly and
retain all samples for hover; do not silently coarsen the metric window to make every bar a pixel wide.
Several buckets can occupy a pixel, so hit-testing selects the nearest time bucket at that zoom. Enlarging
the graph improves access to individual samples; future navigation improvements would be separate scope.

### 5. Local integration and validation

Use the existing mock generator and 24-hour history, then add an isolated Prometheus -> VictoriaMetrics
pipeline and the actual Grafana VictoriaMetrics data source. The exporter currently runs on Windows
loopback: container networking must be configured deliberately, not by pointing a container at its own localhost.
Include recovered outages, missing status, reset counters, long scrape gaps, duplicated labels, and independent
channels. Current mock fixtures have resets/gaps; add recovered-status sequences to test segmented outages.

Run unit checks for normalization, bit units, shared axes and interval boundaries; browser checks for the accepted
native layout, hover, colors, duplicate elements and persistence; integration checks for source timestamps,
300/60-second resolution, dashboard variables/refresh and cancellation. Full compatibility is not established
by a successful wireframe or community panel render.

Keep current WSL limits (4 GB, 4 CPUs) for the existing workload. A full Grafana frontend build may exceed
that budget; measure an isolated build or use a CI build machine rather than increasing PC memory limits
without a deliberate decision. No full build or performance claim was made during this investigation.

## Feasible next step without modifying Grafana

Build a normal TypeScript/React panel plugin with the accepted SVG traffic renderer, right-hand information,
ordinary option editors and a VictoriaMetrics query adapter. Use the Grafana 13.2.2 SDK and its normal plugin
loading/signing process. The graph inside the panel can use the native 120 x 70 design; the overall dashboard
panel also needs room for the information block and Grafana layout constraints.

The limitation is placement: it is a dashboard panel, not an item inside built-in Canvas. Transparent styling
and hiding a title do not turn it into a Canvas element. Ordinary dashboard panels cannot be promised arbitrary
embedding into the user's existing Canvas. The dashboard's own minimum sizes, grid spacing and layout behavior
must be validated in a small proof before promising the final compact arrangement.

If placement inside a freely arranged diagram is indispensable, a separate custom topology panel could own
both router representations and traffic widgets. This also changes the host and brings substantial additional
editor/connection/persistence scope; it has not been approved.

**Decision needed:** accept standalone dashboard-panel placement, or retain the built-in Canvas requirement
and acknowledge that no supported route satisfying both that requirement and unmodified Grafana was found.
Do not begin a core patch or silently substitute a standalone layout.
