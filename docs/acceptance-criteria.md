# Acceptance criteria

These are tests to implement in the next phase, not tests that have already passed.
Proposed defaults remain subject to the [decision log](decisions.md).

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-01 | Select one instance and ifName | Only that interface's data is displayed |
| AC-02 | Change either identifier during an in-flight query | Old responses cannot overwrite the new selection |
| AC-03 | Missing selector, multi-value variable, or duplicate match | Explicit configuration/ambiguity state; no aggregation |
| AC-04 | ifDescr is available | Header displays ifDescr, including safe handling of special characters |
| AC-05 | ifDescr missing | ifName appears as a documented fallback; long text remains readable via tooltip |
| AC-06 | Fresh operational UP | Green circle and UP label appear |
| AC-07 | Fresh confirmed non-UP status | Red DOWN label, original state in tooltip, no traffic background or numeric rates |
| AC-08 | Missing/unknown/stale status or query error | Neutral state distinct from DOWN; no falsely fresh values |
| AC-09 | Capacity metric or override available | Correct positive capacity and decimal bit/s unit; override provenance is visible |
| AC-10 | Capacity unavailable or unreliable | Unknown capacity; valid traffic is still usable |
| AC-11 | Equal IN/OUT values | Equal bar heights in opposite halves of the same scale |
| AC-12 | Different incoming/outgoing values | IN is above zero, OUT below; labels and tooltips remain positive |
| AC-13 | Five-minute windows | Every full bar covers 300 seconds; no silent coarser aggregation |
| AC-14 | Latest range-end averages | IN/OUT values are centered in their own halves and show the correct evaluation window |
| AC-15 | Non-aligned range end | Complete bars stay aligned; newer current values have accurate timestamps |
| AC-16 | 1,000 octets/s input rate | Displayed rate equals 8,000 bit/s (8 kbit/s) |
| AC-17 | kbit/Mbit/Gbit boundaries and large capacity | Decimal scaling, limited precision, and stable axis labels |
| AC-18 | All-zero valid traffic | Show 0 bit/s and a valid scale, not a no-data state |
| AC-19 | Missing direction, missing bucket, or long scrape gap | Missing values remain gaps/“—”; no artificial zeros or connections |
| AC-20 | Counter reset/discontinuity | No false traffic spike; affected windows follow the quality policy |
| AC-21 | Traffic above reported capacity | Axis expands to contain traffic; capacity remains a separate value |
| AC-22 | Historical time range | Values and freshness refer to range end and use the dashboard time zone for labels |
| AC-23 | Compact and larger panels in light/dark themes | Text remains above bars, axes stay sparse, and content does not overlap |
| AC-24 | Range exceeds the supported bucket budget | Explain the limit without silently changing the five-minute interval |
| AC-25 | Grafana 13.2.2 integration | Plugin loads, options work, refresh updates data, and unmount cleans up requests |

## Test layers

1. Unit tests for units, capacity precedence, status mapping, alignment, shared scale, missing values, and validation.
2. Query-adapter tests using synthetic data frames, timestamps, duplicates, failures, and cancellation.
3. Browser tests for the compact panel, option changes, UP/DOWN/UNKNOWN states, and themes on Grafana 13.2.2.
4. A controlled integration check with sanitized production-shaped port/tunnel samples after the metric contract is confirmed.

A release must include meaningful tests of the traffic implementation; a scaffold that merely starts or has no unit tests is not sufficient.
