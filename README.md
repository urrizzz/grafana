# Compact Interface Traffic

A compact Cisco port/tunnel traffic display intended to live **inside Grafana's built-in Canvas panel**.
Each display has its own router/interface selection and can be positioned and resized next to a router representation.

**Target:** Grafana **13.2.2**. **Status:** requirements, design, and runnable mock metrics; no traffic visualization plugin yet.
**Repository:** [urrizzz/grafana](https://github.com/urrizzz/grafana). Changes remain local at the owner's request.

![Proposed scalable traffic component](docs/assets/compact-component.svg)

**Accepted design reference:** [interactive wireframe](docs/assets/scalable-wireframe.html).
See [reference files and implementation guidance](docs/design-reference.md); the wireframe and screenshots are tracked in Git.

## Confirmed behavior

- Prometheus collects every **60 seconds** and forwards metrics to VictoriaMetrics.
- Grafana uses the **VictoriaMetrics data source plugin**.
- Each Canvas traffic display selects `instance` and `ifName`, using fixed values or dashboard variables.
- Put `ifName`, `ifAlias`, `ifDescr`, status and capacity in an information block to the right of the graph. Router fields stay hidden by default.
- Source metric/label mappings and individual identity-field visibility are configurable.
- Capacity comes from `ifHighSpeed`, expressed in Mbit/s at the source.
- Clearly visible blue bars rise above the middle; purple bars extend below it. Current values use matching direction colors with readable contrast.
- Bars represent five-minute average bit rates, using one symmetric scale based on visible traffic.
- Text overlays the graph. Central IN/OUT values are five-minute averages at the dashboard range end.
- Follow dashboard time range and refresh; typical history is 12-24 hours.
- Right-hand status circle and label: green UP, red DOWN, gray UNKNOWN (including stale status).
- Red middle-line segments mark historical DOWN intervals only, including past outages after recovery. Current DOWN retains history and shows central dashes.
- UNKNOWN retains history and shows dashes for central values.
- Keep current information visible; hovering the graph adds a vertical cursor and time-specific IN/OUT rates.
- Design the traffic area at **120 x 70 pixels**, with readable IN/OUT values; scale it proportionally upward.
- Keep channel details outside that traffic area; the right-hand block takes additional space.
- Configure through normal settings; dashboard authors do not write or paste scripts.

## Documentation

| Document | Purpose |
| --- | --- |
| [Accepted design reference](docs/design-reference.md) | Approved visual baseline, tracked assets, and superseded explorations |
| [Product specification](docs/product-spec.md) | Confirmed configuration, layout, and state behavior |
| [Metrics contract](docs/metrics-contract.md) | Source mappings, rates, capacity, and proposed quality rules |
| [Architecture](docs/architecture.md) | Canvas integration feasibility and query boundaries |
| [Acceptance criteria](docs/acceptance-criteria.md) | Conditions the eventual implementation must satisfy |
| [Development plan](docs/development.md) | Implementation sequence and local environment constraints |
| [Decisions](docs/decisions.md) | Confirmed answers, proposed defaults, and remaining technical checks |

## Community alternatives

See the [research and local preview](docs/community-research.md) for similar plugins and the Canvas placement limitation.

## Mock metrics

A [local IF-MIB exporter and history generator](docs/mock-metrics.md) provides ten synthetic channels,
including normal traffic, DOWN, UNKNOWN, missing samples, and counter resets.

## Implementation prerequisite

Embedding this visualization inside the built-in Canvas panel is a firm requirement.
Inspection of the installed Grafana 13.2.2 source found **no supported external Canvas-element registration route**.
**Grafana must remain unmodified**, so a custom build is ruled out. A standalone panel is the recommended
alternative, subject to agreement on dashboard placement instead of built-in Canvas.
See the [implementation investigation](docs/implementation-investigation.md) for concrete options.
Do not assume a standalone panel plugin can be installed as a Canvas element.
The architecture document defines the feasibility check before scaffolding or choosing a delivery model.

Representative exported series/labels and the installed VictoriaMetrics plugin version remain to be inspected.
No software license has been selected. The visualization is not implemented. Changes remain local; no GitHub push.
