# Decisions and remaining technical checks

## Confirmed during the requirements interview

| Topic | Decision |
| --- | --- |
| Target | Grafana 13.2.2 |
| Data path | Prometheus collects, forwards to VictoriaMetrics; Grafana uses the VictoriaMetrics data-source plugin |
| Collection | Every 60 seconds |
| Rates | Five-minute average bit/s for bars and central numbers, with automatic decimal units |
| Capacity | ifHighSpeed, displayed in the right-hand information block |
| Selection | Fixed instance/ifName values and dashboard variables |
| Placement | Inside Grafana's built-in Canvas panel |
| Multiple channels | Independent router/channel settings for every traffic display in the same Canvas |
| Size | Primary traffic area 120 x 70 CSS pixels; design readable text at this size, then scale traffic proportionally upward |
| Compactness | Preserve layout and alignment at very small sizes; avoid fixed-size text crowding the component |
| Author experience | Ordinary settings only; no dashboard-author scripts or manual font retuning per size |
| Time and refresh | Dashboard range and refresh; usually 12-24 hours |
| Router metadata | instance and name are router labels; hidden by default, configurable |
| Channel metadata | ifName, ifAlias, ifDescr shown by default in an information block to the right, outside the traffic area |
| Configuration | Source metric/label names and identity-field visibility can be changed |
| Standard defaults | ifOperStatus, ifHighSpeed, ifHCInOctets, ifHCOutOctets, and standard identity names |
| Plot | Clearly visible IN blue and OUT purple bars; current numbers match direction colors with readable contrast |
| Axis | Shared symmetric autoscale from visible traffic, separate from capacity |
| Current values | Center of each half; five-minute averages ending at dashboard range end |
| UP | Green circle and UP in the right-hand information block |
| DOWN | Red circle and DOWN in the right-hand information block, historical DOWN segments only, retained history, central dashes |
| UNKNOWN | Gray circle and UNKNOWN in right-hand block for missing/stale status, retained history, central dashes |
| Outage history | Red center-line segments only where observed status was DOWN, even if the channel has since recovered; gaps/unknown never imply DOWN |
| Header order | In the right-hand block: channel name, colored circle, status word, on one line (for example TUNNEL01 [circle] UP); existing colors retained |
| Interaction | Hover adds a vertical time cursor plus timestamp/interval and IN/OUT average rates; current information remains directly visible |
| Design reference | Latest interactive wireframe accepted; source and screenshots tracked in Git; see [design-reference.md](design-reference.md) |
| Repository | Keep documentation local for now |

These decisions supersede the initial assumptions of a standalone panel, Prometheus Grafana data source,
hidden history while DOWN/UNKNOWN, ifDescr-only heading, capacity overrides/fallbacks. The later hover requirement supersedes the earlier no-tooltip decision.

## Proposed engineering defaults, not confirmed requirements

- Single-valued dashboard variables; explicit errors for All/multiselect or ambiguous identity.
- Complete UTC-aligned five-minute history buckets and a separate range-end current query.
- Four samples per five-minute window and 180-second status freshness threshold, pending backend tests.
- Raw IF-MIB non-UP states 2/3/5/6/7 mapped to DOWN; code 4/invalid/missing to UNKNOWN.
- Missing enabled metadata shown as a dash; missing capacity shown as unknown.
- Rounded common axis with modest headroom; the implementation must honor the confirmed proportional-scaling requirement.

120 x 70 is the confirmed primary traffic size, excluding the right-hand block. No minimum below it,
fixed information-block width or seven-day maximum range has been approved. The accepted wireframe
provides the starting theme colors and typography.
The previous resize-hint fallback is superseded as the normal response to shrinking the component.
Very small text may become difficult to read, but shrinking must preserve composition rather than crowd it.

## Technical checks before implementation

1. **Canvas extension route:** verify a supported custom element on the exact Grafana 13.2.2 installation.
   A standard panel plugin is not assumed embeddable. See [architecture](architecture.md).
2. **Exported data shape:** inspect full labels and channel metadata for one port and one tunnel; names alone
   do not establish whether metadata is stored as labels or separate series, or how joins remain unique.
3. **Data-source contract:** identify VictoriaMetrics plugin version and prove queries, time steps, rate semantics,
   dashboard events, and per-element isolation.
4. **Packaging:** determine final identity, license, and signing/delivery after the Canvas route is known.

The product interview is sufficient to update the design. Remaining items are concrete technical evidence
or delivery decisions; they are not reasons to silently weaken the built-in Canvas requirement.

The split layout supersedes metadata/status/capacity inside the graph and whole-card downscaling from a large base.
