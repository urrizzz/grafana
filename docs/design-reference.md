# Accepted design reference

Project status: the M1 layout editor is implemented under provisional ID `urrizzz-interfacemap-panel`.
Traffic elements are placeholders; returned-data mapping and live traffic rendering remain pending.
See [current state](current-state.md) for verification and [M1 validation](m1-validation.md) for review.

The owner accepted the traffic wireframe and subsequently the custom diagram panel approach.
The diagram mockup defines the surrounding layout/editor workflow; the traffic wireframe defines each component.
Use this design as the visual and interaction baseline for implementation, together with the
[product specification](product-spec.md), [metrics contract](metrics-contract.md), and
[acceptance criteria](acceptance-criteria.md).

## Source-controlled reference files

| File | Role |
| --- | --- |
| [Interactive wireframe](assets/scalable-wireframe.html) | Primary reference: native size, scaling, UP/DOWN/UNKNOWN, colors, header order, and hover behavior |
| [Overview screenshot](assets/scalable-wireframe.png) | Static review image of the current design |
| [Hover screenshot](assets/scalable-wireframe-hover.png) | Static review image showing the cursor and tooltip |
| [Traffic SVG](assets/compact-component.svg) | Traffic-area-only illustration; does not include the right-hand block or hover code |

The diagram [HTML mockup](assets/diagram-panel-mockup.html) and [screenshot](assets/diagram-panel-mockup.png)
are also accepted references. All six files are tracked in Git. The HTML is self-contained and can be opened directly in a browser.
The accepted interactive baseline first appeared in local commit `18a3c20`; subsequent approved revisions
should update the reference and screenshots together.

## Implementation baseline

- Native traffic area: **120 x 70 CSS pixels**, designed for readable current rates at normal zoom.
- Bright blue incoming bars above zero and purple outgoing bars below zero; one shared symmetric autoscale.
- Current rates in matching direction colors, with contrast protection over the bars.
- Five-minute averages; positive displayed magnitudes for both directions.
- Channel metadata, status, and capacity outside the graph in a block on its right.
- Traffic graph border matches the current status marker: green UP, red DOWN, gray UNKNOWN. Historical outage markers remain time-localized independently.
- Heading order: channel name, colored circle, UP/DOWN/UNKNOWN on the same line.
- Historical traffic remains visible in every operational state. Current DOWN/UNKNOWN values use dashes.
- Red middle-line segments only over observed DOWN intervals, including outages before recovery.
- Hover displays a vertical cursor and the selected five-minute interval with IN/OUT rates.
- Tooltip remains readable independently of graph scaling; leaving the plot clears it.
- Proportional enlargement of the traffic area; independently readable external information.
- Ordinary settings for data source, selection, mappings, and field visibility; no dashboard-author scripts.

The wireframe's current typography and theme colors are the starting visual baseline. Test real data,
long names, and display contrast against it; do not revert to the earlier large-card layout or dim wave graphs.

## Reference versus implementation

The reference uses fictional irregular data, fixed example axis limits and UTC times. It demonstrates
appearance and interaction, not a Grafana plugin or data-source integration. The implementation must use
actual normalized query values for hover (not infer values from SVG bar geometry), automatic units and
scale, dashboard time zone/range/refresh, and real historical status intervals.

The 120 x 70 size excludes the right-hand block. Its exact width and long-text fitting remain implementation
details to validate. The displayed sample labels, rates, dates, and outage times are not production defaults.
The approved host is our own installable diagram panel on unmodified Grafana 13.2.2.
The diagram mockup uses browser storage and static fixtures; production saves options with the dashboard
and consumes Grafana panel-level query results from the selected datasource. No live plugin compatibility is implied by either reference.

## Superseded explorations

[panel-wireframe.svg](assets/panel-wireframe.svg) is an older combined-header exploration, retained for history.
The [community comparison](community-research.md) and its Business Charts dashboard are research artifacts.
Neither is the implementation reference. If an older illustration conflicts with the current design,
use the interactive wireframe and current requirements above.

## Review and change discipline

Validate the implementation at native size, in all three states, after enlargement, and during hover.
Compare screenshots to this reference while testing source data, missing values, and long metadata separately.
Keep approved changes to requirements, interactive reference, and screenshots in the same Git revision.
The owner authorized committing and pushing the accepted references and updated requirements to GitHub.

## Panel editor integration (2026-09-25)

The standalone HTML mockup remains a visual reference. Its separate layout-edit toggle is superseded in
the plugin: opening Grafana panel menu > Edit enables layout controls automatically. Back exits editing;
Grafana Save/Discard manage persistence. Dashboard viewing and grid editing keep the diagram read-only.

## Compact variant: hidden interface details

The accepted default is compact mode, with the channel name centered above the graph. Show interface details
optionally restores the side-information variant with a status circle inside the top-right corner and no reserved side-information
space. Both HTML references now offer Show interface details controls, defaulting to compact mode.
The M3 plugin implements the same variant; validate native-size readability using [M3 validation](m3-validation.md).

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
