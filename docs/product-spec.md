# Product specification

Project status: the M1 layout editor is implemented under provisional ID `urrizzz-interfacemap-panel`.
M2 consumes returned query data for router/channel selection, automatic metadata and current-value previews.
M3 traffic bars, hover and Show interface details are implemented locally; owner review remains pending.
See [current state](current-state.md) for verification and [M1 validation](m1-validation.md) for review.

## Placement and selection

Build an installable custom diagram panel targeting Grafana 13.2.2, with router representations,
connections, and multiple independent traffic displays. Grafana itself must remain unmodified.
The owner approved this approach; it supersedes placement inside the built-in Canvas panel.

The author adds the diagram panel to a dashboard, adds routers and selects their instances, adds chosen
ports/tunnels, and arranges the diagram inside the panel. Routers and traffic elements can be freely moved;
traffic plots resize proportionally from 120 x 70 while the right-hand information and hover remain readable.
Each traffic element references its router and selects its own ifName. Connections have explicit endpoints
and follow their routers continuously while dragged. Automatically choose the facing left/right or top/bottom
box edges from current router positions and dimensions, with bends outside both endpoint boxes.
Recalculate after endpoint changes and layout reload; zoom/scroll must not detach endpoints. Moving a
traffic display alone preserves its configured router-to-router connection. Layout editing activates automatically only inside Grafana's panel editor (panel menu > Edit). Dashboard viewing and dashboard grid editing keep the diagram read-only. There is no separate Edit layout/Finish layout toggle. Back leaves the panel editor and retains pending changes; Grafana Save persists them and Discard cancels them.
Save router/channel settings, positions, plot sizes, and connections with the Grafana dashboard.
The panel occupies a normal dashboard panel region; free placement happens within that region.

Use the [accepted diagram mockup](assets/diagram-panel-mockup.html) for the editor/layout workflow and
[traffic wireframe](assets/scalable-wireframe.html) for individual component rendering.

At diagram level, choose a datasource and configure one or more queries returning the required routers and
channels, traffic history/current rates, status, capacity and metadata. Each traffic element selects from
those results; the router picker lists returned identities and its channel picker lists that router's channels.
The plugin is datasource-independent subject to the [data contract](metrics-contract.md), not tied to VictoriaMetrics.
Individual elements neither issue queries nor have their own datasource query editor.

Each display selects exactly one router (`instance`) and channel (`ifName`), with configurable identity mappings. Both fixed strings and
single-valued dashboard variables are supported. Resolve variables before selection. Proposed handling for
empty values, multi-select/All variables, and duplicate matches is an explicit configuration error.
Do not aggregate different interfaces or choose an arbitrary first match. An unavailable saved selection
remains in place with UNKNOWN/no data and current dashes; never automatically switch to an available channel.

Use the dashboard time range, time zone, and refresh interval. Normal viewing is **12-24 hours**.
The primary traffic area is **120 x 70 CSS pixels**, excluding the information block on its right.
There is no confirmed hard range limit or minimum size below this target. Determine practical limits through testing;
do not silently replace five-minute bars with coarser intervals.

## Configuration-first IF-MIB setup

The standard setup must not require writing every query from scratch. Provide an editable IF-MIB preset
built from panel-level setup settings, while retaining an advanced manual-query path for any compatible
datasource. This is a new requirement, not a feature present in 0.2.0.

- Select the datasource through Grafana. Supply a preset for the first supported VictoriaMetrics query
  format; validate datasource-specific query models before claiming additional preset compatibility.
- Default metric names: ifHCInOctets, ifHCOutOctets, ifOperStatus and ifHighSpeed. Allow changing these
  in setup configuration. Default identity/metadata names: instance, name, ifName, ifAlias, ifDescr.
- Configure router/interface filters and optional extra label matchers (for example job/site) once per
  diagram. Allow dashboard variables. Escape/validate names and literal matcher values when generating
  expressions; distinguish literal filters from explicitly chosen regex/variable filters.
- Generate the required history/current/status/capacity queries and matching result-role configuration.
  Metadata may come from existing labels; do not invent a separately queryable string metric. Expose
  an optional metadata-query override for deployments that need one.
- Preserve the five-minute rate window and bar interval, 60-second expected collection interval, and
  historical range-end semantics. Optional source-quality evidence must not be presented as verified
  unless returned. Configuration-first setup does not change these accepted defaults or data semantics.
- Generated queries remain visible and editable in Grafana's normal Queries tab. Applying a preset is
  an explicit setup action with a preview; never overwrite queries automatically on render, refresh,
  datasource switching, or opening the editor. Preserve custom queries and identify replacements before
  applying. Manual query edits remain authoritative until explicit regeneration; show when preset inputs
  have changed instead of silently keeping two conflicting configurations in sync.
- Persist preset settings, result mappings and per-element selections with the dashboard. Generated
  executable query definitions belong in Grafana targets, not in a parallel plugin query executor.
- Each traffic block only selects router/channel and display options such as Show interface details.
  Source metric names and shared filters belong at panel level, not on every traffic block.

Implementation must use supported Grafana APIs without core modifications. Confirm whether direct query
installation is supported for this panel context; otherwise deliver an importable starter dashboard or
generated panel configuration as the supported preset-loading route. Do not promise a direct in-panel
Load preset button until that API path is verified. The user-facing outcome remains configuration-driven
standard setup with editable queries, not manual construction of all IF-MIB expressions.

## Configurable fields

| Field | Meaning | Default visibility |
| --- | --- | --- |
| `instance` | Router identity label attached by Prometheus | Hidden |
| `name` | Router name label attached by Prometheus | Hidden |
| `ifName` | Channel selection/name | Visible |
| `ifAlias` | Channel alias | Visible |
| `ifDescr` | Channel description | Visible |

Allow source metric/label names to be changed and each identity field to be shown or hidden.
When details are enabled, all three channel fields are visible by default. Router fields are optional because a separate router
representation already provides that context. Missing fields must not silently impersonate another field.
Proposed missing-value presentation is a visible dash for each enabled unavailable field.

Traffic/status/capacity sources are configurable, defaulting to `ifHCInOctets`, `ifHCOutOctets`,
`ifOperStatus`, and `ifHighSpeed`. Textual channel metadata may arrive as labels; its physical representation
must be inspected before implementing the mapping editor. See [metrics contract](metrics-contract.md).
No manual capacity override or `ifSpeed` fallback is part of the confirmed requirements.

## Per-element Show interface details option

Each traffic block has an independent **Show interface details** toggle, disabled by default (including
existing saved blocks with no explicit value). The name refers to the port/tunnel details, not the separate
router representation. Save this setting in the traffic element's panel options.

- Enabled: keep the right-hand information block, its configured identity/metadata and capacity fields,
  and the channel-name-followed-by-status-circle-and-word layout.
- Disabled: remove the entire right-hand information block and its spacing, including any enabled router
  fields, channel name/alias/description, capacity and status word. The traffic element's visible and
  selectable footprint shrinks to the graph width plus a centered channel-name heading above; keep graph dimensions and position unchanged.
- In both modes, show a small status circle inside the graph's top-right corner: green UP,
  red DOWN, gray UNKNOWN. It uses the same range-end status as the border, remains above the bars,
  and must not overlap the current rate values. Give the circle an accessible status label.
- Keep the status-colored border, traffic history, current IN/OUT values and graph hover behavior.
  Hiding details never changes the selected router/channel, data queries, routing or data availability.
- Re-enabling restores the configured details without losing metadata visibility preferences. Duplicating
  a block copies the option; changes to the copy do not affect the original. Save/reload retains it.

This changes the default-only side-information layout requirement into two supported display modes.
Implemented in M3; version 0.3.1 makes compact mode the default and adds the channel heading.

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

Configure the datasource and queries through Grafana's normal panel query editor. Provide ordinary settings for router/channel selection,
source mappings, and field visibility. Dashboard authors must not write, paste, or maintain JavaScript,
ECharts options, SVG rendering code, or similar scripts to obtain the required layout and behavior.
Rendering and scaling logic belong in the component implementation. Standard configuration of the existing
datasource, queries and selectors is required; no production connection is inferred automatically.
Writing datasource queries is explicitly supported; the no-script requirement concerns rendering code.
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
at the range end. Do not display the tiny current-window caption inside the graph; retain range-end semantics in accessible text and hover.
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

## M1 owner feedback (2026-09-25)

Channel name, alias and description come from the router's returned metric data (defaults ifName,
ifAlias, ifDescr), not manual user entry in the finished plugin. Configure metric/query roles and
field/label mappings at panel level; elements select a returned router/channel. Manual fields in M1
are fixture-only scaffolding to be replaced during M2/M4. The plugin does not query routers directly.

Offer 25%, 50%, 75%, 100%, 125% and 150% zoom. Failed editor actions use a compact themed overlay inside the layout, with an explicit Dismiss action.
It must not shift or shrink the diagram; its width is at most 340 px and height at most 110 px (scroll longer text). Clear it after successful changes or element selection;
do not leave old errors in the persistent save hint. Avoid a timer that could hide unread explanations.

### Compact-mode refinement (2026-09-25)

Compact is the default for new/unset blocks; preserve explicit saved visibility choices. In compact mode,
center the channel name plus colored circle and status above the graph, outside its 120 x 70 footprint; constrain long names with ellipsis
and expose the full name on hover. Keep the internal top-right status circle. Remove the tiny 5m/range-end
caption. Draw outage segments prominently at their actual timestamps, never broaden their duration to fit
pixels. Hover includes the full known outage interval overlapping the selected five-minute bucket.

### Status and movement refinement (2026-09-25)

Compact heading: channel name followed by colored circle and UP/DOWN/UNKNOWN, centered above the graph.
Keep the small status circle inside the top-right corner in BOTH compact and full modes. Full mode keeps
its existing side heading. In the editor, use a static four-way arrows movement icon, not a text drag label
or animated image. Preserve an accessible Move <channel> label. This supersedes earlier heading-only and
compact-only corner-indicator wording. Verify both indicators and movement at different zoom levels.
