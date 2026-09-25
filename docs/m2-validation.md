# M2 returned-data validation

Open [Network Traffic Map - M2 data preview](http://localhost:3001/d/network-map-data-dev).
This is a separate dashboard; your saved M1 layout is preserved. The built-in TestData datasource supplies
synthetic frames through Grafana's normal query pipeline. No VictoriaMetrics connection is needed.
Its fixed 12-hour historical range ends at the date in the dashboard picker; changing it without changing
fixture timestamps will deliberately produce missing-current/stale diagnostics. Regenerate the JSON with
`python dev/generate_frame_demo.py` if fixture definitions change.

## Owner checks

1. The data summary reports **2 routers / 4 channels**. CORE-01 Tunnel10 shows Primary WAN and UP;
   BRANCH-01 Tunnel10 shows Backup WAN and DOWN with current dashes. Capacity comes from returned data.
2. Open panel menu > Edit. Select CORE-01: Router instance lists the two returned router identities.
3. Select its traffic using the Move handle. Channel offers Tunnel10 and GigabitEthernet0/1; Tunnel99
   belongs to BRANCH-01 and must not appear as a returned CORE-01 channel.
4. Select GigabitEthernet0/1. Side metadata changes to Uplink / Physical uplink and capacity to 1 Gbit/s.
   No manual alias/description fields are present.
5. Change this traffic block's Router to BRANCH-01. Its saved GigabitEthernet0/1 selection stays in place
   but becomes unavailable/UNKNOWN; it must not silently select another channel or retain old metadata.
6. Select Tunnel99. Metadata only / No rates or status appears; status stays UNKNOWN and rates are dashes.
7. Back > Save > reload. Channel/router selection, mappings and layout remain.
8. Keep Network Map Mock Frames selected for this demo. Switching datasources can replace its queries;
   selecting it again does not restore the A-H fixtures. Use a duplicate dashboard to explore other sources.
   In Grafana panel options, inspect **Identity and quality mappings** and **Query result mappings**.
   They apply to the panel. Metric expressions belong in the normal query editor, not individual blocks.

## Default mappings and query authoring

| Role | Default query refId | Expected result |
| --- | --- | --- |
| Incoming history | A | 5-minute average bit/s at aligned 300-second endpoints |
| Outgoing history | B | Same, positive values (drawing inversion comes in M3) |
| Incoming current | C | 5-minute bit/s at the exact dashboard range end |
| Outgoing current | D | Same |
| Status history | E | IF-MIB operational code at 60-second resolution |
| Status current | F | IF-MIB operational code at range end |
| Capacity | G | ifHighSpeed in Mbit/s, converted once |
| Metadata | H | Identity and metadata labels or table string columns |

These letters are editable mappings, not hardcoded query requirements. Set an exact numeric field name
when a frame contains multiple numeric roles. Empty field selects all numeric fields except configured
identity/metadata/quality fields. Empty refId disables a role. One query can supply multiple roles when
mapped to distinct fields. Time columns use Grafana time type, epoch milliseconds; identity columns are
strings, or labels on numeric series. Default identity keys are instance and ifName. Metadata defaults
are name, ifAlias and ifDescr. ifName is the channel identity/display name.

For VictoriaMetrics, examples remain `8 * rate(ifHCInOctets[5m])` and `8 * rate(ifHCOutOctets[5m])`,
with filters appropriate to your deployment. Configure range vs instant queries and step in the datasource.
The plugin never computes a rate from raw counters or converts returned rates a second time.

Optional sourceTime and sampleCount mappings name companion numeric fields. Source timestamps must be
**epoch milliseconds** (multiply PromQL timestamp() seconds by 1000 in the query). Evidence fields must
apply to the corresponding row/series. Missing evidence is visibly unverified. Low sample counts (<4),
stale source timestamps (>180 seconds), negative/nonfinite values and missing currents produce gaps/dashes.
Current rates require an exact range-end evaluation, including historical ranges. A history point at that
exact time is also acceptable; simply using the last bar before the end is not.

## Boundaries and diagnostics

- Duplicate series, conflicting job/site dimensions or metadata, and repeated timestamps are rejected
  as ambiguous for that channel; nothing is silently summed. Filter queries or map a globally unique
  router identity if instance/ifName alone is ambiguous. ifIndex-only joins are not implemented.
- Unaligned/coarse history produces a visible warning; only complete aligned five-minute windows are
  retained. Missing samples stay gaps. Status intervals cover at most 60 seconds per observed DOWN sample.
- Values with only evaluation timestamps cannot prove fresh raw source samples. Quality remains
  unverified without companion source timestamps/counts; this is not a claim of production validation.
- Single-valued variables can be entered as custom selections (for example $router). Multi-select,
  All, unresolved or empty selections stay unavailable. Selections do not change the queries.
- During loading or query errors, current values are unavailable and status UNKNOWN. Returned historical
  data is retained, but the plugin does not cache results across missing selections.
- Legacy alias/description fields remain in saved JSON for schema compatibility but are ignored for display.
- M3 traffic bars, axes, hover and Show interface details are not implemented yet. Current values and
  metadata are a data-integration preview, not the final compact renderer.

Automated coverage is recorded in current-state.md. Owner results are pending until reported.

## Owner validation and query-loss troubleshooting (2026-09-25)

Owner passed checks 1-6. At check 7 the saved dashboard contained only a default Random Walk query A,
instead of raw-frame queries A-H. Its saved layout, mappings and time range were intact. Restoring only
the eight query definitions recovered the data without resetting the layout. Owner confirmed switching to another datasource and then selecting Network Map Mock Frames again.
The datasource switch reset queries; selecting it again did not restore them. This was not adapter or
save corruption.

If all blocks lose data after saving, inspect the normal Queries tab: this demo requires eight queries
A-H using Raw Frames. Random Walk has no instance/ifName labels and cannot feed this diagram. Changing
the datasource can reset its queries; preserve/recreate the fixture queries when doing so. Reload the
page after a server-side repair before editing again, to avoid re-saving stale query definitions.
Tunnel99 is metadata-only and remains UNKNOWN even with working queries; its metadata should be visible.

## Planned setup improvement

Owner approved configuration-first IF-MIB presets for M4: select a supported datasource, configure shared
metric/label names and filters, then load generated editable queries with matching mappings. Version 0.2.0
still has only mock queries preset; a new panel requires manual queries. See product-spec.md for the new
requirement and the supported-API/starter-dashboard delivery decision to resolve before implementation.
