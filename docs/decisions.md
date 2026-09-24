# Decisions and open questions

## Confirmed requirements

| ID | Decision | Basis |
| --- | --- | --- |
| R-01 | Use `urrizzz/grafana` | Repository supplied by the owner |
| R-02 | Target Grafana 13.2.2 | Match the owner's production version |
| R-03 | Display one Cisco port or tunnel selected by instance and ifName | Requested panel scope |
| R-04 | Display ifDescr, operational state, and bandwidth capacity | Requested panel information |
| R-05 | UP/DOWN uses green/red circles; draw traffic only when UP | Requested state behavior |
| R-06 | IN bars above center; OUT bars inverted below; text overlays the background graph | Requested visual layout |
| R-07 | Five-minute bars, bottom time labels, automatic Y limits, readable bit-rate units | Requested graph behavior |
| R-08 | Central IN/OUT five-minute rates in their respective halves | Requested foreground values |
| R-09 | Begin with repository setup and documentation | Current authorized phase |

## Proposed defaults awaiting confirmation

| ID | Proposal | Reason / what could change |
| --- | --- | --- |
| D-01 | Prometheus-compatible data source with snmp_exporter | Common IF-MIB pipeline; actual storage is not yet confirmed |
| D-02 | Five-minute average bit/s | Defines both bar meaning and central value; peak would need a different query |
| D-03 | Name: Compact Interface Traffic; ID: urrizzz-compacttraffic-panel | Working names only; signing namespace must be checked separately |
| D-04 | Panel-managed queries through an existing data source | Makes instance/ifName options drive all values without manual query edits; needs an API spike |
| D-05 | Shared symmetric autoscale based on observed traffic | Makes IN/OUT directly comparable while keeping quiet traffic visible |
| D-06 | Prefer reported capacity, with explicit configured override | Tunnel speed may not describe the intended service capacity |
| D-07 | Gray UNKNOWN/STALE state and gaps for unavailable metrics | Prevents confusing missing telemetry with a confirmed outage or zero traffic |
| D-08 | 320 x 180 minimum content size; seven-day maximum range | Concrete starting targets for layout and rendering tests |
| D-09 | Aligned complete bars plus current rate at range end | Preserves exact five-minute historical intervals and a fresh central value |
| D-10 | Freshness/coverage policy from the metrics contract | Requires the real scrape interval before implementation |

## Needed next

1. Confirm the data-source type and five-minute average/peak interpretation.
2. Provide sanitized metric samples for one port and one tunnel, including labels and scrape interval.
3. Confirm whether interface-reported tunnel capacity is useful or a configured value is needed.
4. Review the wireframe and proposed compact dimensions.
5. Confirm the plugin identity and choose a software license before distributing code.

These open items do not prevent documenting the project. They must not be silently treated as verified production facts.
