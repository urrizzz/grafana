# Metrics and query contract

**Integration status:** Prometheus plus `snmp_exporter` is a draft assumption. Confirm the actual data source
and metric samples before implementing queries. The names below are examples, not a claim about production.

## Interface identity

The logical key is the selected `instance` plus `ifName`, within the configured data source and any disambiguating labels.
Resolve a unique interface, then use its `ifIndex` for joins when metadata and counter series have different labels.
Do not treat `ifIndex` as a permanent identity across a router restart. Never sum duplicate devices or pick a random series.

Prometheus exporters may expose textual IF-MIB objects as labels on numeric metrics. Configure and verify
lookups for the fields needed by the panel; a string description is not inherently a numeric Prometheus sample.
See the [snmp_exporter generator documentation](https://github.com/prometheus/snmp_exporter/blob/main/generator/README.md).

## Source fields

| Source | Meaning / conversion |
| --- | --- |
| `ifName` | Interface selection name |
| `ifDescr` | Description displayed as the title |
| `ifOperStatus` | Operational-state enumeration |
| `ifHighSpeed` | Capacity estimate in millions of bit/s; multiply by 1,000,000 |
| `ifSpeed` | Capacity estimate in bit/s; saturated maximum is not a usable high-speed capacity |
| `ifHCInOctets`, `ifHCOutOctets` | Preferred 64-bit incoming/outgoing octet counters |
| `ifInOctets`, `ifOutOctets` | 32-bit counter fallback only after validating wrap risk |
| `ifCounterDiscontinuityTime` | Signal that interface counters experienced a discontinuity |

These IF-MIB definitions come from [RFC 2863](https://www.rfc-editor.org/rfc/rfc2863.html).
Capacity selection for this panel is: configured positive override, positive `ifHighSpeed`, valid positive
`ifSpeed`, otherwise unknown. Interface-reported speed is an estimate, not proof of a tunnel's end-to-end throughput.

## Proposed status mapping

| `ifOperStatus` | Panel state |
| --- | --- |
| 1: up | UP, green |
| 2: down; 3: testing; 5: dormant; 6: notPresent; 7: lowerLayerDown | DOWN, red; preserve the original state in the tooltip |
| 4: unknown; missing; unrecognized value | UNKNOWN, gray |

The enum meanings are from RFC 2863; collapsing known non-UP states into the red badge is a panel design decision.
Collector availability alone does not establish interface operational status.

## Five-minute traffic rates

Draft interpretation: one five-minute **average bit rate**, not total transferred bits and not peak rate.
Use the original octet counters and calculate rates in the data source, before rendering.

Illustrative PromQL for one router/interface:

```promql
8 * rate(ifHCInOctets{instance="router-a.example:161", ifName="Tunnel10"}[5m])
8 * rate(ifHCOutOctets{instance="router-a.example:161", ifName="Tunnel10"}[5m])
```

`rate` produces an average per-second counter rate and adjusts for counter resets;
it also extrapolates to range boundaries. It is not an exact packet-accounting total.
See [Prometheus rate documentation](https://prometheus.io/docs/prometheus/latest/querying/functions/#rate).
The factor 8 converts octets/s to bit/s. Do not apply `rate` to an already-derived bit/s gauge.
Do not use `irate` for the requested five-minute average.

These selectors assume `ifName` is present on both counters. If it is only in a metadata series,
first resolve the interface index and query/join with that index. Preserve router and other identifying labels.
Selector values must be correctly escaped as label literals; raw panel text must not be pasted into PromQL.

For a historical range `[T0, T1]`:

1. Complete bar end times are multiples of 300 seconds since the Unix epoch.
2. The first complete bar ends at `ceil((T0 + 300) / 300) * 300`; the last ends at `floor(T1 / 300) * 300`.
3. Evaluate each counter's `rate(...[5m])` at those endpoints with a 300-second query step.
4. Draw a bar over the interval `(endpoint - 300 seconds, endpoint]`.
5. Evaluate the same five-minute expression separately at `T1` for the central current values.

If there is no complete five-minute bucket in the selected range, show a “Range too short for complete bars”
hint; a valid current five-minute value can still be displayed. Do not silently widen the selected chart range.
If Grafana or the data source returns a coarser step than 300 seconds, report that the five-minute resolution
is unavailable instead of labeling coarser samples as five-minute buckets.

## Data quality

- A counter rate requires enough valid samples in the window; unavailable results are missing, not zero.
- A long scrape gap must not become a fabricated zero or a bar bridging the missing interval.
- Proposed coverage rule: use a configured expected scrape interval `S` (must be <=150 seconds),
  require at least two samples and 80% of `floor(300/S)` expected samples per rate window,
  and require a recent source sample. Confirm the production scrape interval before implementing this gate.
- Proposed freshness threshold: `max(3*S, 120 seconds)`, configurable. Compare source-sample time to `T1`.
  Query-result evaluation time is not proof that the underlying sample is fresh.
- Query a companion source timestamp (for example `timestamp(ifOperStatus{...})`) when the data source's
  lookback behavior could otherwise make an old gauge appear current.
- An observed counter discontinuity should invalidate its affected bucket when that metadata is available.
  A reset-adjusted result alone is not evidence of uninterrupted observations.
- Never use negative or non-finite values as traffic. Keep a gap and expose a quality hint.
- Do not combine a 32-bit counter with a 64-bit counter for the same direction. The MVP should report
  unsupported/missing counters unless a safe 32-bit fallback has been explicitly validated.

Coverage and freshness are panel policies proposed for review, not guarantees made by Prometheus.

## Normalized data passed to the renderer

| Field | Contract |
| --- | --- |
| `identity` | Resolved data-source UID, instance, ifName, and optional ifIndex |
| `description` | ifDescr or an explicitly marked ifName fallback |
| `status` | Display state, raw operational code, and source-sample timestamp |
| `capacityBps` | Positive number or null, with reported/configured provenance |
| `history` | Ordered five-minute buckets with end time and nullable nonnegative IN/OUT bit/s |
| `current` | Nullable IN/OUT five-minute bit/s, evaluation time, and source freshness |
| `quality` | Query errors, ambiguity, missing series, stale fields, and coverage gaps |

Formatting and graph inversion belong to the renderer. Normalized data always keeps rates in bit/s.

## Information needed from production

Provide sanitized examples for one port and one tunnel: status, both counters, speed fields, and metadata
carrying `ifName`, `ifDescr`, and `ifIndex`. Include the data-source type, scrape interval, label names,
and whether the same instance/interface can appear under multiple jobs. Do not include SNMP secrets or tokens.
