# Network Traffic Map

An installable **custom Grafana diagram panel** containing router representations, connections, and compact Cisco port/tunnel traffic displays.
Each display has its own router/interface selection and can be positioned and resized next to a router representation.

**Target:** Grafana **13.2.2**. **Status:** M3 compact renderer implemented locally: mirrored traffic bars, shared axes, hover, status borders and optional hidden details. Owner validation pending; IF-MIB query presets remain M4 work.
**Repository:** [urrizzz/grafana](https://github.com/urrizzz/grafana). Documentation and accepted mockups are maintained in this repository.

![Proposed scalable traffic component](docs/assets/compact-component.svg)

**Accepted design reference:** [interactive wireframe](docs/assets/scalable-wireframe.html).
See [reference files and implementation guidance](docs/design-reference.md); the wireframe and screenshots are tracked in Git.

## Confirmed behavior

- Prometheus collects every **60 seconds** and forwards metrics to VictoriaMetrics.
- Choose a datasource and configure one or more queries in Grafana's normal panel query editor. VictoriaMetrics is the current deployment, not a hardcoded dependency.
- Queries return the required routers/channels; each traffic element selects from those results. No per-element queries are issued.
- Each diagram traffic display selects `instance` and `ifName`, using fixed values or dashboard variables.
- Compact mode is the default, with the channel name, colored circle and status centered above the graph. The corner status circle stays visible in both modes. Enable **Show interface details** for the right-hand metadata/status/capacity block. Router fields remain optional.
- Source metric/label mappings and individual identity-field visibility are configurable.
- Capacity comes from `ifHighSpeed`, expressed in Mbit/s at the source.
- Clearly visible blue bars rise above the middle; purple bars extend below it. Current values use matching direction colors with readable contrast.
- Bars represent five-minute average bit rates, using one symmetric scale based on visible traffic.
- Text overlays the graph. Central IN/OUT values are five-minute averages at the dashboard range end.
- Follow dashboard time range and refresh; typical history is 12-24 hours.
- Traffic graph border matches the range-end status: green UP, red DOWN, gray UNKNOWN.
- Right-hand status circle and label: green UP, red DOWN, gray UNKNOWN (including stale status).
- Red middle-line segments mark historical DOWN intervals only, including past outages after recovery. Current DOWN retains history and shows central dashes.
- UNKNOWN retains history and shows dashes for central values.
- Keep current information visible; hovering the graph adds a vertical cursor and time-specific IN/OUT rates.
- Design the traffic area at **120 x 70 pixels**, with readable IN/OUT values; scale it proportionally upward.
- Keep channel details outside that traffic area; turn off **Show interface details** per block to collapse that space and move the status circle inside the top-right corner.
- Configure through normal settings; dashboard authors do not write or paste scripts.

## Documentation

Start development with the [implementation plan](docs/implementation-plan.md) and
[current state](docs/current-state.md). Keep them current with implementation and verification evidence.

| Document | Purpose |
| --- | --- |
| [Accepted design reference](docs/design-reference.md) | Approved visual baseline, tracked assets, and superseded explorations |
| [Product specification](docs/product-spec.md) | Confirmed configuration, layout, and state behavior |
| [Metrics contract](docs/metrics-contract.md) | Source mappings, rates, capacity, and proposed quality rules |
| [Architecture](docs/architecture.md) | Custom diagram editor, persistence, and query boundaries |
| [Acceptance criteria](docs/acceptance-criteria.md) | Conditions the eventual implementation must satisfy |
| [Repository and publishing](docs/repository-and-publishing.md) | Inspected plugin examples, proposed source layout, signing and release process |
| [Implementation plan](docs/implementation-plan.md) | Milestones, dependencies, completion gates and working procedure |
| [M3 validation](docs/m3-validation.md) | Compact graphs, hover, themes and saved detail visibility |
| [Current state](docs/current-state.md) | Implemented features, verification evidence, open items and next work |
| [Development guide](docs/development.md) | Tool commands and local environment constraints |
| [Decisions](docs/decisions.md) | Confirmed answers, proposed defaults, and remaining technical checks |

## Community alternatives

See the [research and local preview](docs/community-research.md) for similar plugins and the Canvas placement limitation.

## Mock metrics

A [local IF-MIB exporter and history generator](docs/mock-metrics.md) provides ten synthetic channels,
including normal traffic, DOWN, UNKNOWN, missing samples, and counter resets.

## Agreed implementation approach

Add one custom diagram panel to the dashboard, add routers and select their instances, then add the
interfaces to display. Freely position routers and traffic elements, resize plots, and configure connections
inside the panel. Save the diagram with the Grafana dashboard; turn editing off for normal viewing.
Grafana 13.2.2 remains unmodified. This supersedes the original built-in Canvas placement requirement.

The [diagram mockup](docs/assets/diagram-panel-mockup.html) is the accepted layout/editor reference;
the existing [traffic wireframe](docs/assets/scalable-wireframe.html) remains the component reference.
See [diagram workflow](docs/diagram-panel-concept.md) and [architecture](docs/architecture.md).
The [Canvas investigation](docs/implementation-investigation.md) explains why this route was selected.

Representative returned frames and labels remain to be inspected, with VictoriaMetrics as the first integration example.
No software license has been selected (`UNLICENSED` for now). The provisional plugin ID is
`urrizzz-interfacemap-panel`; a Grafana Cloud account is not required for local development.
Confirm the organization prefix before signing or publishing. Live traffic implementation remains pending.

## Run the development panel

Use Node 24 and Docker Compose. From the repository root:

```sh
npm ci
npm run check
npm run server
npm run e2e
```

Open [the M2 data preview](http://localhost:3001/d/network-map-data-dev) and follow [M2 validation](docs/m2-validation.md). It uses synthetic frames via Grafana TestData. The original [layout dashboard](http://localhost:3001/d/interface-map-dev) is preserved. The separate development container uses port 3001 and a 1 GiB limit.
Stop it with `npm run server:stop` when finished. Your existing port-3000 Grafana remains separate.
See [development instructions](docs/development.md) for the full workflow and encrypted workspace access.

Source is in `src/`; build configuration in `.config/`; demo provisioning in `provisioning/`; browser tests
in `tests/`; mock metrics in `dev/`; approved mockups and requirements in `docs/`. `dist/` is generated.
GitHub CI validates changes; the manual packaging workflow creates unsigned development artifacts only.
