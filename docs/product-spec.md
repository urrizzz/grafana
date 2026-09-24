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
There is no confirmed hard range limit or minimum display size. Determine practical limits through testing;
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

- Keep the circle and UP/DOWN/UNKNOWN word in the top-left corner.
- Show enabled identity fields and capacity directly in the display, above the background bars.
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

## Proportional scaling and compact use

Very small placement is a primary requirement. Scale the **entire component together**: channel metadata,
capacity, IN/OUT values, status label and circle, font sizes, spacing, margins, bars, axes, and axis labels.
Preserve relative positions and the visual hierarchy as the component shrinks or grows. Fixed-size fonts
or padding must not consume the chart area and cause crowding, clipping, or overlap when resized smaller.
Do not require manual font adjustments for each size or replace the visualization with a resize warning
solely because it has been made small. Keep enabled content in the layout; size alone must not hide fields.

Text will naturally become harder to read at very small physical sizes. Proportional scaling preserves
alignment and composition; it does not guarantee readability at arbitrarily small dimensions.
No exact minimum size or aspect ratio has been selected. Non-proportional width/height changes and unusually
long metadata need visual validation; they must not distort glyphs or cause content to collide.
The earlier proposed resize-hint fallback is superseded by proportional scaling as the normal resize behavior.

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

| Range-end state | Top-left indicator | Historical bars | Central IN/OUT | Middle line |
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
