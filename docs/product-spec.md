# Product specification

## Placement and selection

Build a compact traffic display **inside the built-in Grafana Canvas panel**, targeting Grafana 13.2.2.
Support multiple independently configured displays in the same Canvas, placed beside router representations.
Each display can be freely moved and resized; the whole visual scales proportionally, including its fonts.
Canvas extension feasibility is an implementation prerequisite, not an already-proven capability.

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

- Place the status circle and UP/DOWN/UNKNOWN label in the information block to the right of the traffic area.
- Move all enabled channel/router identity fields and capacity into that right-hand block, outside the graph.
- Keep only the traffic graph, IN/OUT rates and their axis/direction labels inside the 120 x 70 traffic area.
- Incoming traffic is **blue**, occupies the upper half, and grows upward.
- Outgoing traffic is **purple**, occupies the lower half, and grows downward.
- Center the current IN and OUT values within their respective plot halves.
- Draw a middle zero line and sparse time labels along the lower axis.
- When DOWN, make the middle line **red**; retain both directions of historical bars.
- Use the same symmetric Y-axis magnitude for both directions, based on visible valid traffic.
- Format capacity, rates, and axis values automatically in bit/s, kbit/s, Mbit/s, or Gbit/s.
- Keep all rate labels nonnegative; inversion is only a plotting operation.

No hover tooltips are requested. Identity, rates, status, units, and time context must be available directly.
Text must have clear contrast over bars in light and dark themes. Status also has a word, not only a color.

The [interactive wireframe](assets/scalable-wireframe.html) shows the revised split layout at native size.
The older combined-header illustration and community comparison are superseded layout explorations.

## Compact size and scaling

Design the traffic area at **120 x 70 CSS pixels first**, with readable current rates at normal browser zoom.
Do not achieve that size by shrinking a larger design until its fonts become unreadable. The revised wireframe
proposes 11.5 px central values, 8 px direction labels and 7 px axes; exact typography remains for visual review.
Scale the traffic area proportionally when enlarging it, including typography, spacing, bars and axes.
Do not introduce overlap, distorted glyphs, or per-size font adjustments by the dashboard author.

The right-hand information block contains ifName, ifAlias, ifDescr, status and capacity. Router fields remain
optional and hidden by default. This block uses additional space: 120 x 70 describes the traffic area only.
Its typography must remain readable independently of the graph size. Exact information-block width and
wrapping are proposed layout details, not fixed requirements. Enabled fields must not silently disappear.
There is no promised readability below the primary size. Validate long metadata and arbitrary resize proportions.
No tooltips or dashboard-author rendering scripts are required.

## Configuration without author-written scripts

Provide a purpose-built component with ordinary settings for the data source, router/channel selection,
source mappings, and field visibility. Dashboard authors must not write, paste, or maintain JavaScript,
ECharts options, SVG rendering code, or similar scripts to obtain the required layout and behavior.
Rendering and scaling logic belong in the component implementation. Standard configuration of the existing
data source and selectors is still required; no production connection is inferred automatically.
Community examples demonstrate visual possibilities but do not satisfy this requirement simply by loading
custom chart scripts into a general-purpose panel.

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
| Fresh UP | Green circle + UP | Available history remains | Valid five-minute averages | Neutral |
| Fresh DOWN | Red circle + DOWN | Available history remains | Dashes | Red |
| Missing, unknown, or stale status | Gray circle + UNKNOWN | Available history remains | Dashes | Neutral |
| UP with missing traffic direction | Green circle + UP | Available history remains; missing buckets are gaps | Available direction numeric, missing direction dash | Neutral |

A status change alone must never clear history. Historical traffic remains scoped to the selected interface
and dashboard range. If a history query fails, any retained cached history must be visibly marked stale;
never reuse a previous interface's data. Separate a query error from a confirmed device DOWN state.
UNKNOWN does not use the red DOWN line. Capacity can remain visible in every state when trustworthy.

## Scope

Visualize existing collected data. SNMP polling, router configuration, alerting, aggregation across channels,
and replacing the built-in Canvas with another visualization are outside the agreed scope.
See [architecture](architecture.md) for the unresolved Canvas integration route.
