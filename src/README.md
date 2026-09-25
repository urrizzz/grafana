# Network Traffic Map - compact traffic diagram

Provisional plugin ID: urrizzz-interfacemap-panel. Target: Grafana 13.2.2.

Open Grafana panel menu > Edit to arrange routers, traffic blocks and connections. Use the normal query
editor for datasource/metric queries, then panel options to map query results. Each block selects a
returned router/channel; alias and description come from data. Back > Save persists the configuration.

M3 adds mirrored bars, shared axes, status borders, hover values and per-block Show interface details.
Turn details off to keep just the graph with an internal status circle. Query presets remain M4 work. The local M2 dashboard uses synthetic TestData frames, not
production traffic. No custom per-element requests or Grafana backend plugin are used.

Source, requirements and validation guides: https://github.com/urrizzz/grafana
Signing/publication remain unconfigured.
