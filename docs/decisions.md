# Decisions and remaining technical checks

## Confirmed during the requirements interview

| Topic | Decision |
| --- | --- |
| Target | Grafana 13.2.2 |
| Data path | Prometheus collects, forwards to VictoriaMetrics; Grafana uses the VictoriaMetrics data-source plugin |
| Collection | Every 60 seconds |
| Rates | Five-minute average bit/s for bars and central numbers, with automatic decimal units |
| Capacity | ifHighSpeed, with its standard millions-of-bit/s meaning |
| Selection | Fixed instance/ifName values and dashboard variables |
| Placement | Inside Grafana's built-in Canvas panel |
| Multiple channels | Independent router/channel settings for every traffic display in the same Canvas |
| Size | Freely resizable, adapting text and chart |
| Time and refresh | Dashboard range and refresh; usually 12-24 hours |
| Router metadata | instance and name are router labels; hidden by default, configurable |
| Channel metadata | ifName, ifAlias, ifDescr all shown by default |
| Configuration | Source metric/label names and identity-field visibility can be changed |
| Standard defaults | ifOperStatus, ifHighSpeed, ifHCInOctets, ifHCOutOctets, and standard identity names |
| Plot | IN blue above zero; OUT purple below zero; foreground text over background bars |
| Axis | Shared symmetric autoscale from visible traffic, separate from capacity |
| Current values | Center of each half; five-minute averages ending at dashboard range end |
| UP | Green circle and UP in top-left |
| DOWN | Red circle and DOWN in top-left, red middle line, retained history, central dashes |
| UNKNOWN | Gray circle and UNKNOWN for missing/stale status, retained history, central dashes |
| Interaction | No tooltips; information directly visible |
| Repository | Keep documentation local for now |

These decisions supersede the initial assumptions of a standalone panel, Prometheus Grafana data source,
hidden history while DOWN/UNKNOWN, ifDescr-only heading, capacity overrides/fallbacks, and hover tooltips.

## Proposed engineering defaults, not confirmed requirements

- Single-valued dashboard variables; explicit errors for All/multiselect or ambiguous identity.
- Complete UTC-aligned five-minute history buckets and a separate range-end current query.
- Four samples per five-minute window and 180-second status freshness threshold, pending backend tests.
- Raw IF-MIB non-UP states 2/3/5/6/7 mapped to DOWN; code 4/invalid/missing to UNKNOWN.
- Missing enabled metadata shown as a dash; missing capacity shown as unknown.
- Rounded common axis with modest headroom; responsive text with a visible resize hint if needed.

No fixed minimum dimensions, seven-day maximum range, or exact color hex values have been approved.

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
