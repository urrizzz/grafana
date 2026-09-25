# Product specification

## Placement and selection

Build an installable custom diagram panel targeting Grafana 13.2.2, with router representations,
connections, and multiple independent traffic displays. Grafana itself must remain unmodified.
The owner approved this approach; it supersedes placement inside the built-in Canvas panel.

The author adds the diagram panel to a dashboard, adds routers and selects their instances, adds chosen
ports/tunnels, and arranges the diagram inside the panel. Routers and traffic elements can be freely moved;
traffic plots resize proportionally from 120 x 70 while the right-hand information and hover remain readable.
Each traffic element references its router and selects its own ifName. Connections have explicit endpoints
and follow their routers when moved. Edit mode exposes layout/configuration controls; viewing mode hides them.
Save router/channel settings, positions, plot sizes, and connections with the Grafana dashboard.
The panel occupies a normal dashboard panel region; free placement happens within that region.

Use the [accepted diagram mockup](assets/diagram-panel-mockup.html) for the editor/layout workflow and
[traffic wireframe](assets/scalable-wireframe.html) for individual component rendering.

Each display selects exactly one router (`instance`) and channel (`ifName`). Both fixed strings and
single-valued dashboard variables are supported. Resolve variables before selection. Proposed handling for
empty values, multi-select/All variables, and duplicate matches is an explicit configuration error.
Do not aggregate different interfaces or choose an arbitrary first match.

Use the dashboard time range, time zone, and refresh interval. Normal viewing is **12-24 hours**.
The primary traffic area is **120 x 70 CSS pixels**, excluding the information block on its right.
There is no confirmed hard range limit or minimum size below this target. Determine practical limits through testing;
do not silently replace five-minute bars with coarser intervals.

## Configurable fields

| Field | Meaning | Default visibility |
| --- | --- | --- |
| `instance` | Router identity label attached by Prometheus | Hidden |
| `name` | Router name label attached by Prometheus | Hidden |
| `ifName` | Channel selection/name | Visible |
| `ifAlias` | Channel alias | Visible |
| `ifDescr` | Channel description | Visible |

Allow source metric/label names to be changed and each identity field to be shown or hidden.
All three channel fields are visible by default. Router fields are optional because a separate router
representation already provides that context. Missing fields must not silently impersonate another field.
Proposed missing-value presentation is a visible dash for each enabled unavailable field.

Traffic/status/capacity sources are configurable, defaulting to `ifHCInOctets`, `ifHCOutOctets`,
`ifOperStatus`, and `ifHighSpeed`. Textual channel metadata may arrive as labels; its physical representation
must be inspected before implementing the mapping editor. See [metrics contract](metrics-contract.md).
No manual capacity override or `ifSpeed` fallback is part of the confirmed requirements.

## Layout

The traffic graph border must match the current (dashboard range-end) status color: **green for UP,
red for DOWN, gray for UNKNOWN**, using the same colors as the status marker. Apply this to the graph
rectangle in both the component wireframe and diagram mockup, including after status changes and resizing.
The border reflects range-end status; red middle-line segments continue to represent historical DOWN
intervals only. A currently UP graph therefore has a green border even if earlier outage segments are red.
Diagram selection handles/outlines remain separate editing indicators and must not replace the status border.

- In the right-hand information block, put the channel name first, immediately followed on the same line by the colored circle and status word: `TUNNEL01 [circle] UP`. Apply this order to DOWN and UNKNOWN too; retain the existing status colors.
- Move all enabled channel/router identity fields and capacity into that right-hand block, outside the graph.
- Keep only the traffic graph, IN/OUT rates and their axis/direction labels inside the 120 x 70 traffic area.
- Incoming traffic is **blue**, occupies the upper half, and grows upward. Bars must be clearly visible, not dim background decoration.
- Outgoing traffic is **purple**, occupies the lower half, and grows downward.
- Center the current IN and OUT values within their respective plot halves. Use matching blue IN and purple OUT numbers; preserve readability over bars with a contrasting outline or backing.
- Draw a middle zero line and sparse time labels along the lower axis.
- Draw **red middle-line segments only over known historical DOWN intervals**, aligned to the time axis. Keep the rest of the line neutral and retain traffic history.
- Use the same symmetric Y-axis magnitude for both directions, based on visible valid traffic.
- Format capacity, rates, and axis values automatically in bit/s, kbit/s, Mbit/s, or Gbit/s.
- Keep all rate labels nonnegative; inversion is only a plotting operation.

Identity, current rates, status, units, and time context remain visible directly. Hovering adds historical detail.
Text must have clear contrast over bars in light and dark themes. Status also has a word, not only a color.

The owner accepted the [interactive wireframe](assets/scalable-wireframe.html) as the implementation design
reference. See [design reference](design-reference.md) for the tracked source and screenshots.
The older combined-header illustration and community comparison are superseded layout explorations.

## Compact size and scaling

Design the traffic area at **120 x 70 CSS pixels first**, with readable current rates at normal browser zoom.
Do not achieve that size by shrinking a larger design until its fonts become unreadable. The revised wireframe
uses 11.5 px central values, 8 px direction labels and 7 px axes as the accepted starting visual baseline.
Validate real-data readability and long labels during implementation.
Scale the traffic area proportionally when enlarging it, including typography, spacing, bars and axes.
Do not introduce overlap, distorted glyphs, or per-size font adjustments by the dashboard author.

The right-hand information block contains ifName, ifAlias, ifDescr, status and capacity. Router fields remain
optional and hidden by default. This block uses additional space: 120 x 70 describes the traffic area only.
Its typography must remain readable independently of the graph size. Exact information-block width and
wrapping are proposed layout details, not fixed requirements. Enabled fields must not silently disappear.
There is no promised readability below the primary size. Validate long metadata and arbitrary resize proportions.
No dashboard-author rendering scripts are required.

## Configuration without author-written scripts

Provide a purpose-built component with ordinary settings for the data source, router/channel selection,
source mappings, and field visibility. Dashboard authors must not write, paste, or maintain JavaScript,
ECharts options, SVG rendering code, or similar scripts to obtain the required layout and behavior.
Rendering and scaling logic belong in the component implementation. Standard configuration of the existing
data source and selectors is still required; no production connection is inferred automatically.
Community examples demonstrate visual possibilities but do not satisfy this requirement simply by loading
custom chart scripts into a general-purpose panel.

## Hover inspection

Hovering the graph shows a vertical line at the selected time and a tooltip with the time/five-minute
interval and both incoming (IN) and outgoing (OUT) average rates. Here IN/OUT are traffic directions,
not the operational UP/DOWN state. Use positive magnitudes and automatic bit-rate units for both.
The cursor follows the pointer, snapping to the corresponding five-minute bucket, across both plot halves.

Keep the tooltip readable at the native 120 x 70 graph size; it may extend outside the graph and must not
be scaled down with its SVG. Use dashboard time zone in the implemented component (the fixture uses UTC).
Missing samples display a dash rather than a fabricated zero. Tooltip values describe the hovered bucket,
while central values continue to describe the dashboard range end. Historical inspection works even if
current status is DOWN/UNKNOWN. Leaving the plot removes the cursor and tooltip. This supersedes the earlier
no-tooltip requirement; current information must still be visible without hover.

## Rates, history, and axes

Each bar represents average bit/s over five minutes. At 60-second collection, the window normally contains
five samples. Counter processing must account for resets and missing observations.
Current central values are five-minute averages evaluated at the **dashboard range end**, including historical views.
They are not wall-clock values when the operator views an older range.

Proposed historical alignment: completed UTC-aligned five-minute buckets, plus a separate current evaluation
at the range end. Show a compact visible time/window caption so non-aligned current values are not misleading.
The exact alignment remains an engineering default, not an additional user decision.

Autoscale both halves together from observed traffic, with proposed rounded bounds and modest headroom.
Capacity stays separate and does not force the scale or clip traffic. Zero is valid; missing data is a gap.
At 12 hours there are up to 144 complete buckets per direction; at 24 hours, up to 288.

## State behavior

| Range-end state | Indicator in right-hand block | Historical bars | Central IN/OUT | Middle line |
| --- | --- | --- | --- | --- |
| Fresh UP | Green circle + UP | Available history remains | Valid five-minute averages | Red only at known historical DOWN intervals |
| Fresh DOWN | Red circle + DOWN | Available history remains | Dashes | Red only at known historical DOWN intervals |
| Missing, unknown, or stale status | Gray circle + UNKNOWN | Available history remains | Dashes | Red only at known historical DOWN intervals |
| UP with missing traffic direction | Green circle + UP | Available history remains; missing buckets are gaps | Available direction numeric, missing direction dash | Red only at known historical DOWN intervals |

A status change alone must never clear history. Historical traffic remains scoped to the selected interface
and dashboard range. If a history query fails, any retained cached history must be visibly marked stale;
never reuse a previous interface's data. Separate a query error from a confirmed device DOWN state.
Unknown/stale intervals never produce red segments. Previously observed DOWN intervals remain red even when
range-end status is UP or UNKNOWN. Capacity can remain visible in every state when trustworthy.

The range-end badge and dashes describe the latest state; the segmented red line describes status history.
Do not extend a current DOWN state across the whole selected time range or infer outages from zero traffic.
Status-history gaps must remain unknown rather than being bridged into a continuous outage.

## Scope

Visualize existing collected data. SNMP polling, router configuration, alerting, aggregation across channels,
and reproducing all built-in Canvas features are outside the agreed scope.
See [architecture](architecture.md) for the custom diagram panel implementation boundaries.
