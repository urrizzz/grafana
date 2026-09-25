# Acceptance criteria

Project status: the standard development panel scaffold exists with provisional ID
`urrizzz-interfacemap-panel`. Diagram editing and live traffic remain unimplemented; the HTML references
and synthetic metric tools remain separate from the runtime scaffold.

These are future implementation checks, not tests already passed. The custom diagram approach is approved; live plugin validation remains pending.

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-01 | Host integration | Installable custom diagram panel operates on unmodified Grafana 13.2.2 |
| AC-02 | Multiple displays | Each retains independent instance/ifName settings and data |
| AC-03 | Fixed selectors or dashboard variables | Both work, including changes during in-flight requests |
| AC-04 | Empty/ambiguous selection | Clear configuration state; no arbitrary channel selection or aggregation |
| AC-05 | Default metadata visibility | ifName, ifAlias, ifDescr visible in right-hand block; router instance/name hidden |
| AC-06 | Mapping/visibility changes | Custom source names and individual field visibility work without code edits |
| AC-07 | Metadata safety and missing fields | Text is safe; missing enabled fields are explicit; no hover required |
| AC-08 | Capacity value 100 | ifHighSpeed displays 100 Mbit/s in right-hand block; no manual override or ifSpeed fallback assumed |
| AC-09 | Missing capacity | Explicit unknown capacity; history remains usable |
| AC-10 | Fresh UP | Green circle and UP in right-hand block; valid current rates visible |
| AC-11 | Fresh DOWN | Red circle and DOWN in right-hand block, red middle-line segments limited to known DOWN intervals, both current values dashes; history retained |
| AC-12 | Missing/stale/unknown status | Gray circle and UNKNOWN in right-hand block, current dashes, history retained; unknown intervals not marked red, prior known outages retained |
| AC-13 | Status changes | DOWN/UNKNOWN do not clear history or replace it with zero |
| AC-14 | Direction and color | Clearly visible blue IN upward and purple OUT downward; current numbers match those colors and stay readable over bars |
| AC-15 | Equal rates | Equal magnitude produces equal heights above/below zero |
| AC-16 | Autoscale | Same scale in both halves based on visible traffic, independent of capacity |
| AC-17 | Rates and units | Five-minute averages in decimal bit units; 1,000 octets/s becomes 8 kbit/s |
| AC-18 | Historical range | Central averages evaluated at range end; visible time labels use dashboard zone |
| AC-19 | History resolution | Five-minute intervals preserved; no silent coarsening |
| AC-20 | Missing traffic/reset | Gaps/dashes, no fabricated zeros or reset spikes; zero remains valid traffic |
| AC-21 | Hover inspection | Vertical cursor and readable tooltip show hovered five-minute interval and positive IN/OUT average rates; current values remain visible and unchanged |
| AC-22 | Placement and resize | Element moves/resizes inside our diagram panel; traffic scales proportionally from native 120 x 70 layout; settings persist on reload |
| AC-23 | Dashboard refresh | Data follows dashboard refresh with no independent timer or accumulating subscriptions |
| AC-24 | Real backend | Consumes compatible Grafana query results without datasource-specific request code; validate generic frame fixtures and VictoriaMetrics with 60-second collected data |
| AC-25 | Normal history load | Multiple elements remain readable and responsive over 12-24 hours |
| AC-26 | Query failure | Visible error/staleness; no false DOWN state or cross-interface cached data |
| AC-27 | Themes and accessibility | Foreground is legible, status has words, and colors preserve IN/OUT distinction |
| AC-28 | Proportional size reduction/enlargement | Traffic fonts, spacing, bars and axes scale together; external information stays readable |
| AC-29 | Very small component | At 120 x 70, IN/OUT values are readable at normal zoom; metadata/status/capacity stay outside the graph |
| AC-30 | Non-proportional resize and long metadata | No glyph distortion or overlapping content; fitting policy is visually validated |
| AC-31 | Dashboard-author setup | Required behavior is available through ordinary settings without JavaScript, ECharts/SVG scripts, or per-size font adjustments |
| AC-32 | Recovered channel | UP badge/current rates with red segments still visible only at earlier known DOWN times |
| AC-33 | Intermittent outage and missing status | Red segments align with observed DOWN intervals; no red across UP/UNKNOWN or collection gaps |
| AC-34 | Native-size color contrast | Bright bars and matching colored current values remain distinguishable at 120 x 70 in both themes |
| AC-35 | Channel heading | Name is immediately followed on the same line by the colored circle and UP/DOWN/UNKNOWN word; existing colors retained |
| AC-36 | Hover at native size and after resize | Cursor stays aligned to the selected bucket; tooltip remains readable outside the plot and leaves with the pointer |
| AC-37 | Historical hover while DOWN/UNKNOWN or missing traffic | Available historical rates remain inspectable; missing values are dashes, not zero; timestamps use dashboard zone |
| AC-38 | Status-colored traffic border | Graph outline matches the status marker (green UP, red DOWN, gray UNKNOWN) in both previews and after resizing/state changes; historical outage segments remain independent |

## Diagram-specific acceptance criteria

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-39 | Create diagram | Add our panel, routers with instance selectors, and chosen interfaces through ordinary settings |
| AC-40 | Free placement | Move router and traffic elements independently within the diagram; plot and channel information stay bound to the same interface |
| AC-41 | Connections | Endpoint IDs persist; during dragging lines stay on box boundaries and automatically switch facing left/right/top/bottom sides; bends avoid both endpoint interiors; verify reversed, vertical and diagonal arrangements, endpoint changes, zoom/scroll and reload |
| AC-42 | Edit/view mode | Layout controls appear in edit mode; normal viewing supports traffic hover without accidental dragging |
| AC-43 | Dashboard persistence | Save/reload retains routers, selectors, positions, plot sizes, mappings, visibility, and connections without browser-local storage |
| AC-44 | Router change/removal | Selection changes refresh dependent traffic without old-router data; removing a router cannot silently rebind dependents |
| AC-45 | Duplicate panel | Layout/settings survive duplication and runtime selection/query state stays isolated |

## Datasource-independent query acceptance

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-46 | Normal datasource/query editor | Author chooses a datasource and one or more queries returning the needed routers/channels and logical data roles |
| AC-47 | Dependent selection | Router picker derives identities from results; channel picker is scoped to that router; custom identity label/field names work |
| AC-48 | Element selection and duplication | Elements reuse returned data; choosing or duplicating a component triggers no per-element datasource request |
| AC-49 | Selected channel disappears | Layout/selection retained, UNKNOWN/no data and current dashes; never reuse another channel's data |
| AC-50 | Custom result mappings | Query aliases/refIds/fields map to rates, status, capacity and metadata without requiring fixed output metric names |
| AC-51 | Incomplete/coarse results | Missing roles, insufficient resolution and unavailable quality evidence are explicit; no fabricated rates, timestamps or outages |
| AC-52 | Query persistence | Grafana saves datasource/query definitions; plugin options save result mappings, selections and layout |

## Validation layers

First prove the normal panel lifecycle and configurable returned-frame contract on the target installation.
Then test pure axis/unit/state logic, Grafana query-result updates and data isolation, and browser-level diagram interactions.
Use synthetic counter fixtures for normal rates, resets, missing samples, and state transitions; supplement them
with sanitized production-shaped port/tunnel samples. Validate 12-24 hours and multiple independent elements.
Validate native 120 x 70 traffic at normal browser zoom, plus 150% and 200% enlargement and independent
width/height changes. Check all states and long metadata in the right-hand block. No larger-card downscale
may turn the primary values into unreadable tiny text.
Documentation checks do not constitute plugin compatibility or implementation tests.

## Accepted reference

Use the [accepted design reference](design-reference.md) for visual and interaction checks at native
120 x 70, larger sizes, all operational states, and hover. Keep both mockup HTML files and their screenshots tracked
and synchronized with approved changes. Older illustrations and community previews are not the baseline.
