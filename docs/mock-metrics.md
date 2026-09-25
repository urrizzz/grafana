# Synthetic IF-MIB development data

Project status: the M1 layout editor is implemented under provisional ID `urrizzz-interfacemap-panel`.
Traffic elements are placeholders; returned-data mapping and live traffic rendering remain pending.
See [current state](current-state.md) for verification and [M1 validation](m1-validation.md) for review.

`dev/mock_metrics.py` provides a Python standard-library exporter and a 24-hour history generator.
No new Python packages are required. This is synthetic test data, not a claim about production labels.
All series carry `mock="true"`, `job="cisco-mock"`, and a scenario label.

## Run locally

From `C:\Codex\projects\grafana`, as Yuri (EFS access required):

```powershell
& C:\Codex\.venv\Scripts\python.exe dev/mock_metrics.py serve
```

Endpoint: `http://127.0.0.1:9187/metrics`; health: `/health`. Stop the foreground process with Ctrl+C.
Default binding is Windows loopback. A Docker container cannot reach that binding via its own localhost.
For Docker scraping, explicitly bind an appropriate host interface and use `host.docker.internal:9187`,
or run the exporter inside the same Docker network. That network setup is not configured by this exporter.
A scrape/remote-write example is in `dev/prometheus.example.yml`. Keep `honor_labels: true` so the
synthetic router instance is preserved instead of being replaced with the exporter endpoint.
Prometheus collects every 60 seconds; Grafana queries five-minute counter rates.

## Scenarios

| Router | Channel | Scenario |
| --- | --- | --- |
| 192.0.2.10 / mock-core | GigabitEthernet0/0 | UP, varying traffic, 1 Gbit/s capacity |
| 192.0.2.10 / mock-core | Tunnel10 | UP, varying traffic, 100 Mbit/s capacity |
| 192.0.2.10 / mock-core | Tunnel20 | DOWN from 30 minutes before scenario anchor; prior history retained |
| 192.0.2.10 / mock-core | Tunnel30 | Status missing from 10 minutes before anchor; traffic continues |
| 192.0.2.20 / mock-branch | Tunnel10 | UP with valid zero traffic |
| 192.0.2.20 / mock-branch | Tunnel40 | Counter reset 20 minutes before anchor |
| 192.0.2.20 / mock-branch | Tunnel50 | Collection gap between 45 and 30 minutes before anchor |
| 192.0.2.20 / mock-branch | Tunnel60 | Missing outgoing counter |
| 192.0.2.20 / mock-branch | Tunnel70 | Missing capacity |
| 192.0.2.20 / mock-branch | Tunnel80 | Explicit UNKNOWN status code 4 |

Fields: `ifOperStatus`, `ifHighSpeed`, `ifHCInOctets`, `ifHCOutOctets` and a synthetic `ifMetadata=1`
carrier. `instance`, `name`, `ifName`, `ifAlias`, `ifDescr`, and `ifIndex` are labels on every sample.
The synthetic `ifMetadata` carrier is not a standard IF-MIB metric. Source mappings will eventually
allow different production representations. Descriptions and aliases are strings, not numeric gauges.

Counters integrate seeded irregular minute-by-minute profiles in octets: variable loads, quiet periods and
bursts, independently seeded per channel and direction. Profiles repeat after seven days, not hourly.
They remain deterministic so live scrapes and generated history agree; they are not instantaneous rates.
DOWN counters stop increasing. Missing data is omitted, not emitted as zero. Restarting with the same
persisted anchor preserves the scenario and counter model. Historical gaps and reset events age naturally;
stop the exporter and supply a new `--anchor` to both serving and history commands to replay them.
Default anchor lives in ignored `data/mock-anchor.json`. Explicit `--anchor` does not modify that file.

## Generate history without waiting 24 hours

```powershell
& C:\Codex\.venv\Scripts\python.exe dev/mock_metrics.py history --hours 24
```

Writes ignored `data/mock-history.jsonl`, sampled at 60 seconds, with millisecond timestamps.
Live and historical samples use the same model and anchor. This command generates a file only.
To import into a **local development** single-node VictoriaMetrics, after starting that service:

```powershell
Invoke-WebRequest -Method Post -Uri http://127.0.0.1:8428/api/v1/import `
  -ContentType application/json -InFile data/mock-history.jsonl
```

The [VictoriaMetrics import format](https://docs.victoriametrics.com/victoriametrics/#how-to-import-data-in-json-line-format)
uses one series per JSON line. Do not import fixtures into production. Use a clean development database
when replaying new anchors to avoid mixing different scenario runs under the same labels.
Scrape output follows [Prometheus text exposition](https://prometheus.io/docs/instrumenting/exposition_formats/).

Example query:

```promql
8 * rate(ifHCInOctets{mock="true",instance="192.0.2.10",ifName="Tunnel10"}[5m])
```

## Checks and limits

```powershell
& C:\Codex\.venv\Scripts\python.exe -m unittest discover -s dev -p test_mock_metrics.py
```

Tests cover byte/bit conversion, counter growth, DOWN history, missing fields, reset/gap behavior, and
history/live consistency. The exporter alone is not a query backend: Grafana still needs a running
query backend and its Grafana datasource. VictoriaMetrics is the current example; configure panel-level
queries for all desired mock routers/channels, then select them in the diagram. Live custom diagram panel integration remains to be implemented and validated.

The initial development run was started in a hidden process. Its PID is recorded in
`data/mock-exporter.pid`; stdout/stderr logs are in the same ignored directory. Verify the PID still
belongs to this exporter before stopping it. The exporter does not start automatically after a PC restart.

Changing the mock generator model changes synthetic counter values. Regenerate fixtures and use a clean
development database when switching models to avoid mixing counter histories. No history is imported automatically.

## M2 Grafana-frame fixture

The independent M2 data preview uses dev/generate_frame_demo.py and Grafana TestData rather than the
exporter/backend pipeline. It supplies rates/status/capacity/metadata as returned data frames at a fixed
historical range. See [M2 validation](m2-validation.md). It validates the panel adapter and selection;
it does not validate counter-rate semantics in VictoriaMetrics, which remains M5 work.
