# Network Traffic Map - data integration preview

Provisional plugin ID: urrizzz-interfacemap-panel. Target: Grafana 13.2.2.

Open Grafana panel menu > Edit to arrange routers, traffic blocks and connections. Use the normal query
editor for datasource/metric queries, then panel options to map query results. Each block selects a
returned router/channel; alias and description come from data. Back > Save persists the configuration.

M2 includes current rates, status, capacity and quality diagnostics. M3 bars, axes, hover and optional
hidden interface details remain pending. The local M2 dashboard uses synthetic TestData frames, not
production traffic. No custom per-element requests or Grafana backend plugin are used.

Source, requirements and validation guides: https://github.com/urrizzz/grafana
Signing/publication remain unconfigured.
