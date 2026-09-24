# Architecture and Canvas feasibility

## Required host

Deployment constraint: Grafana itself must remain unmodified. Do not patch core source, modify runtime
bundles, or deploy a custom Grafana build.

The user explicitly requires multiple independently configured, movable, resizable traffic displays
**inside Grafana's built-in Canvas panel**, running Grafana **13.2.2**.
A standalone panel on the dashboard is not an agreed substitute.
The earlier standalone panel-plugin architecture is superseded by this requirement.

## Extension feasibility: source investigation complete

Read-only inspection of the exact installed Grafana 13.2.2 source found that the registry, picker and saved
element resolution use internal element lists, with no supported external Canvas registration route exposed.
A normal panel plugin cannot satisfy this host requirement through the inspected supported APIs.
See [implementation investigation](implementation-investigation.md) for version evidence, code locations,
delivery alternatives and the proposed renderer/query design.

The owner confirmed that Grafana cannot be modified, ruling out source-integrated elements and custom builds.
A standalone panel is the recommended feasible alternative, but changes the agreed placement requirement
and has not been approved. No supported route meeting both unmodified Grafana and built-in Canvas placement
was found. See the investigation for the standalone approach and layout limitations.

## Data flow and query ownership

```mermaid
flowchart LR
  A[Cisco IF-MIB collection] --> B[Prometheus: 60-second collection]
  B --> C[VictoriaMetrics]
  C --> D[Grafana VictoriaMetrics data source]
  E[Dashboard range, variables and refresh] --> F[Canvas integration: to verify]
  G[Independent element selectors and mappings] --> F
  F --> D
  D --> H[Normalize metadata, status, rates and quality]
  H --> I[Blue IN / purple OUT with text overlay]
```

Use the existing data source's Grafana query/authentication path. Do not query routers or collect SNMP in this project.
The feasibility spike must decide whether Canvas-owned queries can supply separately keyed frames or whether a supported
host adapter can generate them per element. Per-element settings do not automatically become data-source query variables.
The user should not have to manually synchronize several query expressions after selecting another channel.

Use configured source mappings, resolve fixed values/dashboard variables, and preserve exactly one channel per element.
Deduplicate identical requests where useful, cancel obsolete subscriptions, and ignore late responses for old selections.
Keep history requests (300-second resolution), range-end current rates, and metadata/status logically distinct. Query status history at collection resolution to derive time-localized DOWN intervals.
Use dashboard refresh events, not a second polling clock. Preserve valid history on DOWN/UNKNOWN transitions.
Data from one element must never leak into another. Verify reload/duplication preserves independent settings.

## Rendering and configuration requirements

Implement proportional scaling within the component, including traffic typography, margins, axes, bars,
and overlays. Do not leave labels or padding at fixed screen-pixel sizes while only the plot shrinks.
Keep the visual hierarchy, text alignment, and shared IN/OUT geometry consistent at different sizes.

A proposed implementation is a shared logical coordinate system with a uniform scale derived from available
width and height, using SVG viewBox behavior or equivalent transforms. This is an engineering option, not a
confirmed rendering technology or aspect ratio. Validate arbitrary element proportions without stretching
text. Long metadata needs an explicit fitting policy; shrinking alone must not hide enabled fields.

Package layout, querying, and scaling behavior behind ordinary component settings. Users select the data
source, router/interface, mappings, and visible fields without editing chart functions or rendering scripts.
The Business Charts research preview remains a separate scripted comparison, not the intended configuration UX.

## Proposed implementation boundaries

| Area | Responsibility |
| --- | --- |
| Host integration | Canvas element registration, editing, persistence, resize, dashboard lifecycle |
| Options | Selectors, mappings, visibility, data-source reference and validation |
| Queries | VictoriaMetrics plugin requests, interpolation, fixed-step history, cancellation |
| Normalization | Unique identity, metadata, rates, capacity, source freshness and errors |
| Rendering | Mirrored bars, shared scale, text overlay, state circle and historical DOWN line segments |
| Formatting | Decimal bit units and directly visible time/quality information |

TypeScript with React and matching Grafana packages is a candidate after the host API is established.
The provisional display name is Compact Interface Traffic. Packaging, plugin ID, signing, and code layout depend on
that decision; the old provisional standalone panel ID is not an accepted Canvas delivery model.

Use SVG or another supported rendering primitive with blue/purple bars and foreground text. The [accepted wireframe](design-reference.md) is an interactive
design reference, not an embeddable Grafana implementation. Hover inspection is required: a vertical time cursor and tooltip show both rates for the selected bucket.
Benchmark multiple elements at 12-24 hours (up to 576 bars per element at 24 hours) and longer user-selected ranges.
A seven-day hard limit and a fixed minimum size are not confirmed requirements.

## Hover rendering

Map pointer coordinates into the plot time domain after applying its scale. Read hovered values from the
normalized historical data, not drawing geometry. Render tooltip text outside the scaled plot coordinates
so it remains readable at 120 x 70. Keep it within the viewport, clear it when leaving/changing selection,
and leave central range-end values unchanged. Canvas edit/drag gestures must remain usable.

## Revised compact layout

The primary traffic area is 120 x 70 CSS pixels. Design readable IN/OUT values at that native size
and scale upward proportionally. Put identity fields, status and capacity in a separate block to its right,
with readable independent typography. The block consumes additional space. This supersedes whole-card
downscaling and metadata/status/capacity overlays inside the graph. Keep the blocks bound to the same
interface; validate placement and lifecycle together in the eventual Canvas integration.
