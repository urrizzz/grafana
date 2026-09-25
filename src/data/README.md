# Data implementation boundary

Implement the datasource-independent PanelData adapter, result mappings, router/channel index and normalization here.
Grafana owns panel-level datasource queries; elements select from returned data without fetching it.
Follow ../../docs/metrics-contract.md; no live frame adapter is implemented yet.
