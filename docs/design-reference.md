# Accepted design reference

The owner accepted the latest interactive wireframe after the hover interaction was added.
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

All four files are tracked in Git. The HTML is self-contained and can be opened directly in a browser.
The accepted interactive baseline first appeared in local commit `18a3c20`; subsequent approved revisions
should update the reference and screenshots together.

## Implementation baseline

- Native traffic area: **120 x 70 CSS pixels**, designed for readable current rates at normal zoom.
- Bright blue incoming bars above zero and purple outgoing bars below zero; one shared symmetric autoscale.
- Current rates in matching direction colors, with contrast protection over the bars.
- Five-minute averages; positive displayed magnitudes for both directions.
- Channel metadata, status, and capacity outside the graph in a block on its right.
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
Built-in Grafana Canvas integration on 13.2.2 remains an unresolved technical prerequisite; approving the
wireframe does not approve substituting standalone panels or modifying Grafana core.

## Superseded explorations

[panel-wireframe.svg](assets/panel-wireframe.svg) is an older combined-header exploration, retained for history.
The [community comparison](community-research.md) and its Business Charts dashboard are research artifacts.
Neither is the implementation reference. If an older illustration conflicts with the current design,
use the interactive wireframe and current requirements above.

## Review and change discipline

Validate the implementation at native size, in all three states, after enlargement, and during hover.
Compare screenshots to this reference while testing source data, missing values, and long metadata separately.
Keep approved changes to requirements, interactive reference, and screenshots in the same Git revision.
Source control here means local Git; GitHub push remains deferred at the owner's request.
