# Community alternatives research

Reviewed on 2026-09-24 for Grafana 13.2.2 and the agreed built-in Canvas placement requirement.

## Result

No exact ready-made community component was found in this search that combines the requested compact
traffic card with placement inside Grafana's built-in Canvas. Several standalone panels can reproduce
parts of the result. This is a search finding, not proof that no such project exists.

## Candidates

| Candidate | Closest fit | Gap for this project | Local verification |
| --- | --- | --- | --- |
| Business Charts 7.2.5 | Configurable charts and graphic/text overlays; mirrored bars can approximate the card | Requires chart JavaScript and query/mapping work; separate panel, not a Canvas element | Installed and rendered UP/DOWN/UNKNOWN comparison on 13.2.2 |
| ACE.SVG 0.2.0 | Arbitrary SVG layout with data-driven rendering | Requires custom drawing/update code; separate panel | Catalog/source documentation reviewed; not installed |
| Network Weathermap NG 1.6.12 | Device/link topology, bidirectional link values and historical replay | Different interaction/layout; no verified compact mirrored-bar Canvas widget | Catalog and upstream description reviewed; not installed |
| ESnet Network Map 3.1.0 | Logical/geographic network maps with bidirectional traffic | Topology-first visualization; not this card or a built-in Canvas extension | Catalog documentation reviewed; not installed |
| Built-in Canvas | Free positioning of elements, text/metrics and router-style representations | A supported external time-series element registration route remains unverified | No new custom element was added in this research |

The best visual reuse candidate is **Business Charts**, if a standalone panel or a custom chart-based layout
is acceptable. That would change the agreed host requirement and is not assumed approved.
If built-in Canvas is mandatory, continue investigating its exact 13.2.2 extension path before implementing.
ACE.SVG is an alternative for a code-driven whole-diagram layout, not an automatic way to embed a panel into Canvas.

## Subsequent user clarification

The user emphasized that the component must work in a very small space by scaling fonts and all other
visual elements proportionally. General-purpose panels that retain fixed text sizes become crowded when
shrunk. The dashboard author must not need scripts or manual font retuning to obtain the component.
The comparison remains useful as a rendering experiment, but its scripted configuration and current layout
do not meet these requirements. No change to the built-in Canvas requirement has been approved.
See the [product specification](product-spec.md) for the updated acceptance scope.

## Local preview

Open [Cisco Traffic - Community Comparison](http://localhost:3000/d/cisco-community-preview).

Three Business Charts examples use the project's synthetic IF-MIB counter model: UP, DOWN, UNKNOWN.
They show blue incoming bars, purple inverted outgoing bars, text overlay, shared symmetric axes, capacity,
channel metadata and central dashes for DOWN/UNKNOWN. DOWN retains history and adds a red center line.

**These examples are our custom configuration of a general-purpose community plugin, not an existing
ready-made Cisco traffic component.** They are ordinary dashboard panels. The plugin's option named
canvas refers to a drawing renderer and does not mean integration into Grafana's Canvas visualization;
the preview uses its SVG renderer.

Data is a fixed 12-hour fixture embedded in the dashboard, with five-minute average rates computed from
the mock counter model. It does not query VictoriaMetrics or subscribe to the exporter. Changing dashboard
range/refresh does not regenerate the fixture. This is a visual reuse evaluation, not end-to-end integration.

Reproducible files:

- `dev/build_community_preview.py`: generates the dashboard from the saved mock anchor.
- `dev/community-preview.dashboard.json`: importable Grafana dashboard.
- `data/community-preview.png`: local screenshot, ignored by Git.

Business Charts was installed through the Grafana CLI and Grafana was restarted. No production system was
accessed. Existing dashboards were not replaced. The comparison dashboard UID is `cisco-community-preview`.
Remove that dashboard to remove the preview; the plugin can be uninstalled separately if no longer wanted.

## Checks and limits

Confirmed server version 13.2.2, installed plugin version 7.2.5, successful dashboard import, valid displayed
timestamps, all three rendered states, and no uncaught browser errors in Chromium. Source files, screenshot,
and downloaded plugin files in the workspace were checked for EFS encryption.
This does not establish full production compatibility: the catalog minimum is 12.3.0 while its prose
compatibility table still names Grafana 11/12. Only the described local rendering path was exercised.

No community plugin or custom source was published, no Grafana core code was modified, and no GitHub push occurred.

## Primary sources

- [Business Charts catalog and documentation](https://grafana.com/grafana/plugins/volkovlabs-echarts-panel/)
- [Business Charts upstream repository](https://github.com/grafana/business-charts)
- [Chart function API](https://grafana.com/docs/plugins/volkovlabs-echarts-panel/latest/charts-function/)
- [ACE.SVG catalog and usage](https://grafana.com/grafana/plugins/aceiot-svg-panel/)
- [Network Weathermap NG catalog](https://grafana.com/grafana/plugins/tamirsuliman-weathermap-panel/)
- [Network Weathermap NG upstream](https://github.com/allamiro/grafana-network-weathermap-ng)
- [ESnet Network Map catalog](https://grafana.com/grafana/plugins/esnet-networkmap-panel/)
- [Built-in Canvas element documentation](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/canvas/)

Versions above were observed during research; catalog minimum versions alone are not runtime compatibility tests.
