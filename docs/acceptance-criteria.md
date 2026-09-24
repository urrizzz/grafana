# Acceptance criteria

These are future implementation checks, not tests already passed. Canvas feasibility must be resolved first.

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-01 | Host integration | Traffic display operates inside the built-in Canvas on Grafana 13.2.2 |
| AC-02 | Multiple displays | Each retains independent instance/ifName settings and data |
| AC-03 | Fixed selectors or dashboard variables | Both work, including changes during in-flight requests |
| AC-04 | Empty/ambiguous selection | Clear configuration state; no arbitrary channel selection or aggregation |
| AC-05 | Default metadata visibility | ifName, ifAlias, ifDescr visible; router instance/name hidden |
| AC-06 | Mapping/visibility changes | Custom source names and individual field visibility work without code edits |
| AC-07 | Metadata safety and missing fields | Text is safe; missing enabled fields are explicit; no hover required |
| AC-08 | Capacity value 100 | ifHighSpeed displays 100 Mbit/s; no manual override or ifSpeed fallback assumed |
| AC-09 | Missing capacity | Explicit unknown capacity; history remains usable |
| AC-10 | Fresh UP | Green circle and UP in top-left; valid current rates visible |
| AC-11 | Fresh DOWN | Red circle and DOWN in top-left, red middle line, both current values dashes; history retained |
| AC-12 | Missing/stale/unknown status | Gray circle and UNKNOWN, current dashes, history retained; no red DOWN line |
| AC-13 | Status changes | DOWN/UNKNOWN do not clear history or replace it with zero |
| AC-14 | Direction and color | Blue IN upward; purple OUT downward; text remains above bars |
| AC-15 | Equal rates | Equal magnitude produces equal heights above/below zero |
| AC-16 | Autoscale | Same scale in both halves based on visible traffic, independent of capacity |
| AC-17 | Rates and units | Five-minute averages in decimal bit units; 1,000 octets/s becomes 8 kbit/s |
| AC-18 | Historical range | Central averages evaluated at range end; visible time labels use dashboard zone |
| AC-19 | History resolution | Five-minute intervals preserved; no silent coarsening |
| AC-20 | Missing traffic/reset | Gaps/dashes, no fabricated zeros or reset spikes; zero remains valid traffic |
| AC-21 | No tooltips | Required fields/rates/time context directly visible without hover |
| AC-22 | Placement and resize | Element moves/resizes inside Canvas; plot/text adapt; settings persist on reload |
| AC-23 | Dashboard refresh | Data follows dashboard refresh with no independent timer or accumulating subscriptions |
| AC-24 | Real backend | Works through the VictoriaMetrics data-source plugin with 60-second collected data |
| AC-25 | Normal history load | Multiple elements remain readable and responsive over 12-24 hours |
| AC-26 | Query failure | Visible error/staleness; no false DOWN state or cross-interface cached data |
| AC-27 | Themes and accessibility | Foreground is legible, status has words, and colors preserve IN/OUT distinction |

## Validation layers

First prove the Canvas host and VictoriaMetrics query contracts on the target installation.
Then test pure rate/axis/unit/state logic, query cancellation and data isolation, and browser-level Canvas interactions.
Use synthetic counter fixtures for normal rates, resets, missing samples, and state transitions; supplement them
with sanitized production-shaped port/tunnel samples. Validate 12-24 hours and multiple independent elements.
Documentation checks do not constitute plugin compatibility or implementation tests.
