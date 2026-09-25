# Returned-data adapter

model.ts defines mappings, channel identity and normalized data. adapter.ts consumes PanelData only;
Grafana owns query execution. It indexes labelled series and table rows, normalizes rates/status/capacity,
keeps ambiguous selections unavailable, and reports missing evidence rather than inventing quality.
See ../../docs/metrics-contract.md and ../../docs/m2-validation.md for exact input shapes and limits.
