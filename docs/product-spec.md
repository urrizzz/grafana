# Product specification

## Goal

Let an operator scan many small dashboard panels and immediately answer:
which port/tunnel is this, is it operational, what is its capacity, and how much traffic is flowing in each direction?
One panel represents one interface on one router. IN and OUT are from the router interface's perspective.

## Configuration

| Parameter | Requirement | Proposed behavior |
| --- | --- | --- |
| `instance` | Required | Exact router identity in the selected data source |
| `ifName` | Required | Exact interface name on that router |
| Data source | Required integration setting | Reference to an existing Grafana data source; Prometheus support is the initial proposal |
| Capacity override | Optional | Positive bit/s value, useful for tunnel/service capacity; show its configured origin |
| Additional selector | Conditional | Optional label constraints such as `job` or `site` when the two required identifiers are not globally unique |

Proposed variable support: allow single-valued Grafana template variables in `instance` and `ifName`.
Resolve them before querying, and show the resolved identity in the tooltip.
Empty values, multi-select variables, and `All` are configuration errors for the one-interface MVP.
An additional selector must not silently broaden the query to multiple interfaces.

The panel options must drive the data selection. Changing an interface must not require the operator to
manually edit several PromQL expressions. The proposed integration is described in [architecture.md](architecture.md).

## Layout

The chart is the background layer of the panel, not a separate chart below a statistics card.
Use a thin horizontal zero line to divide equal-height upper and lower plot regions.
Render incoming bars upward and outgoing bars downward at matching timestamps.

The foreground has three groups:

1. Header: green/red status circle and readable status, `ifDescr`, and capacity with units.
2. Upper center: `IN` and the current five-minute rate.
3. Lower center: `OUT` and the current five-minute rate.

Reserve narrow margins for Y labels and the bottom time labels. Use subdued, distinguishable bar colors
and enough foreground contrast that both rate values and the description remain readable over the bars.
Use Grafana's light/dark theme tokens. A status word accompanies color; color is not the only signal.

Proposed compact target: **320 x 180 CSS pixels** of panel content. Also validate at 480 x 240.
Below the supported minimum, show a clear resize hint instead of overlapping content.
Truncate long descriptions with an ellipsis and reveal the full description in a tooltip.
The fallback when `ifDescr` is missing or blank is `ifName`, with that fallback explained in the tooltip.
Do not substitute `ifAlias` for `ifDescr` without an explicit future option.

See the [wireframe](assets/panel-wireframe.svg). Its values, colors, and dimensions are illustrative.

## Chart and units

- A bar covers one five-minute interval. The draft uses average bit/s over that interval.
- Use the dashboard time range. Proposed normal viewing range: one hour; the operator can change it.
- Keep the stored incoming and outgoing rates nonnegative. Invert OUT only when mapping values to pixels.
- Share a symmetric Y-axis magnitude so equal IN and OUT rates have equal bar heights.
- Choose a rounded axis maximum from the largest valid visible rate with approximately 10% headroom.
  Do not force the axis to the interface capacity: low traffic must remain visible.
- Capacity stays visible as a separate value even when the traffic axis uses a different maximum.
- Choose sparse, readable ticks: about three time labels at the compact size, more only when space permits.
  Respect the dashboard time zone. Internal bucket alignment uses UTC instants.
- Use decimal factors of 1,000. Capacity and each central value may choose their own readable unit;
  all Y ticks use a consistent unit. OUT values and tooltips display positive magnitudes.
- Use at most three significant digits for central values. Never convert bit/s into byte/s.
- For valid all-zero traffic, show `0 bit/s` and a small nonzero axis span; do not show “No data.”
- Do not replace a missing bucket with zero or interpolate across a missing interval.

For large time ranges, do not silently turn five-minute bars into larger time buckets.
The proposed MVP limit is seven days (2,016 complete buckets per direction). A larger range should
request a shorter range until a longer-range rendering strategy is explicitly designed.

## Current values and time semantics

The current IN/OUT labels are the latest available five-minute averages evaluated at the dashboard range end.
When viewing a historical interval, they describe that interval's end, not the wall clock.
Their tooltip includes the evaluation timestamp and window. A live dashboard uses its current range end.

Completed history bars are aligned to five-minute boundaries. If the range ends between boundaries,
the central current values may be newer than the last complete bar; the tooltip makes that distinction visible.
Do not draw an incomplete bucket as though it were a complete five-minute historical bar.
The detailed sampling rule is in [metrics-contract.md](metrics-contract.md).

## State behavior

| State | Badge | Plot and central values |
| --- | --- | --- |
| Fresh operational UP | Green circle + UP | Render available bars and IN/OUT rates |
| Fresh confirmed non-UP state | Red circle + DOWN | Hide traffic bars; show `—` for rates and retain description/capacity |
| Missing, unknown, or stale status | Gray circle + UNKNOWN or STALE | Hide traffic bars and rates; do not infer DOWN |
| UP with no traffic samples | Green UP + “No traffic data” | No bars; show `—`, not zero |
| UP with one missing direction | Green UP | Render the available direction; show `—` in the missing half |
| Query failure | Neutral error indication | Do not present cached values as fresh; distinguish failure from DOWN |
| More than one matching interface | Configuration error | Show no combined graph or arbitrary “first” result |

The exact raw-state mapping and freshness rule are in the metrics contract. The UP/DOWN plot rule applies
to status at the range end. A currently DOWN interface does not retain a visible historical traffic background
in this MVP. A selected historical interval can still display traffic if its range-end status is UP.

Show the capacity even while DOWN if a trustworthy value is available. Missing capacity is `Capacity unknown`;
do not invent a value. Valid traffic can exceed a reported capacity and must not be clipped or rewritten.

## Boundaries

This project visualizes already-collected metrics. Router polling, SNMP credential management, alerting,
configuration changes on Cisco devices, interface aggregation, and traffic forecasting are outside the MVP.
The first implementation targets Grafana 13.2.2; broader version compatibility requires separate validation.
