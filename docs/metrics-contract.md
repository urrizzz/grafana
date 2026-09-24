# Metrics and query contract

## Confirmed pipeline

Cisco IF-MIB -> existing collection pipeline -> Prometheus -> VictoriaMetrics ->
**VictoriaMetrics Grafana data source plugin** -> Canvas traffic display.
Prometheus collects every **60 seconds**. The exact collector/exporter is not confirmed; do not assume snmp_exporter.
VictoriaMetrics is the query engine; a Prometheus-compatible query is not evidence of identical evaluation semantics.

## Selection and mappings

Each display has its own fixed/variable `instance` and `ifName`. Router `instance` and `name` are labels
attached by Prometheus. Channel fields are `ifName`, `ifAlias`, and `ifDescr`.
The user confirmed the standard names and wants configurable source names and field visibility.
A sample with full labels is still needed to establish how channel metadata joins to the counters.

| Logical role | Default source name | Meaning |
| --- | --- | --- |
| Router identity | `instance` | Router label; hidden by default |
| Router name | `name` | Router label; hidden by default |
| Channel selection/name | `ifName` | Selected channel; visible by default |
| Channel alias | `ifAlias` | Visible by default |
| Channel description | `ifDescr` | Visible by default |
| Operational status | `ifOperStatus` | IF-MIB state code |
| Capacity | `ifHighSpeed` | Millions of bit/s; multiply by 1,000,000 |
| Incoming counter | `ifHCInOctets` | Cumulative 64-bit incoming octets |
| Outgoing counter | `ifHCOutOctets` | Cumulative 64-bit outgoing octets |

IF-MIB object definitions: [RFC 2863](https://www.rfc-editor.org/rfc/rfc2863.html).
Descriptions/aliases may be labels on a numeric metadata series rather than independently queryable numeric metrics.
Support explicit field mapping after inspecting the exported shape; do not invent numeric string metrics.
Preserve router identity and any required job/site labels when joining. If needed, resolve `ifIndex` for joins;
it must not be treated as a permanent identity across restarts. Ambiguous matches must not be silently summed.
Validate configurable metric identifiers and escape selector values; display metadata as text, never executable HTML.

Capacity uses the mapped `ifHighSpeed` only. A positive source value of 100 means 100 Mbit/s.
Missing, invalid, or zero capacity is proposed to display as unknown, not to trigger an unrequested fallback.
Reported capacity does not determine the plotted Y limit. Real traffic can exceed the device's estimate.

## Five-minute averages

Illustrative expressions, assuming `instance` and `ifName` exist on counter series:

```promql
8 * rate(ifHCInOctets{instance="router-a.example:161", ifName="Tunnel10"}[5m])
8 * rate(ifHCOutOctets{instance="router-a.example:161", ifName="Tunnel10"}[5m])
```

Metric and label identifiers must come from the configured mappings. The factor 8 converts octets/s to bit/s.
Use a five-minute average counter rate, not peak, `irate`, transferred-byte totals, or a rate of an already-derived gauge.
Validate VictoriaMetrics rate-window, reset, missing-data, and query-step behavior against known synthetic counters.
Do not claim Prometheus extrapolation rules describe VictoriaMetrics without a backend-specific check.

Proposed bucket algorithm for dashboard range `[T0, T1]` in epoch seconds:

1. First complete bucket endpoint: `ceil((T0 + 300) / 300) * 300`.
2. Last complete endpoint: `floor(T1 / 300) * 300`.
3. Evaluate five-minute rates every 300 seconds; draw each interval `(endpoint - 300, endpoint]`.
4. Evaluate current IN/OUT separately at `T1`, over the five minutes ending there.
5. Format visible time labels in the dashboard time zone; keep a visible current-window caption.

If there are no complete bars, show a short visible range hint; a valid current value may still be shown when UP.
Never relabel coarser returned samples as five-minute buckets. The data-source request must preserve 300-second resolution.
Refresh follows the dashboard; the collector's 60-second interval is not an independent UI refresh timer.

## Status and quality

Proposed raw-state mapping, subject to fixtures: 1 = UP; 2/3/5/6/7 = DOWN; 4, missing, or invalid = UNKNOWN.
These codes include non-UP IF-MIB states such as testing/dormant, so the raw distinction can be exposed as a
visible diagnostic if needed. No tooltip is required. Missing or stale status maps to UNKNOWN, never inferred DOWN.
DOWN/UNKNOWN at range end show central dashes but do not suppress available history. The red middle line
is segmented from historical status samples, independently of the latest state. Query mapped ifOperStatus
history across the dashboard range in addition to range-end status. Use the 60-second collection resolution
for status transitions rather than averaging operational codes into five-minute traffic buckets.

Build red intervals only from observed valid DOWN states; retain past outages after recovery. Missing/stale
status and zero traffic do not prove DOWN. Do not carry a state across collection gaps. Exact transition
boundaries are limited by polling resolution. Proposed interval policy: each valid DOWN sample covers to the
next timely observation (at most one expected 60-second interval); clip to the dashboard range and merge
adjacent known-DOWN intervals. A final sample never establishes an outage beyond the range end.
This interval policy is an engineering proposal; the confirmed requirement is time-localized outage markers.

Proposed quality defaults (engineering policies, not user-confirmed thresholds):

- With a 60-second scrape, require at least four valid samples in a five-minute window and fresh source data.
- Treat a status source sample older than 180 seconds relative to range end as stale.
- Inspect real source timestamps; evaluation timestamps can conceal stale observations.
- Reject negative/non-finite rates and preserve missing windows as gaps rather than zero.
- Validate counter resets/discontinuities. Use optional discontinuity metadata when present; do not invent it.
- Do not silently switch to 32-bit counters or fabricate data across long scrape gaps.

Exact sample coverage and freshness checks require testing against VictoriaMetrics and the installed data-source plugin.
A stale status does not make otherwise valid historical traffic disappear.

## Renderer contract

Pass resolved identity, enabled metadata values, normalized state, nullable capacity in bit/s, positive-or-zero
IN/OUT history, timestamped status history / normalized DOWN intervals, current rates with their evaluation
window, and per-field quality into the renderer.
Keep both directions nonnegative in the model; only OUT drawing coordinates are inverted.
Include enough visible quality information to distinguish zero, missing, stale, and failed queries without hover.

## Remaining technical evidence

Inspect one sanitized port and tunnel with full label sets, metadata representation, timestamps, and duplicate job/site cases.
Record the installed VictoriaMetrics data-source plugin ID/version. Neither the confirmed field names nor the data-source name
alone proves the exported label layout or query API contract. Do not include credentials in examples.
