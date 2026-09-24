# Development plan

## Repository

- Remote: `https://github.com/urrizzz/grafana.git`
- Main branch: `main`
- Local checkout on the development PC: `C:\Codex\projects\grafana`
- Current phase: documentation and project definition. There is no application build command in this repository yet.

The local machine already has Node.js 24 LTS, npm, Git, VS Code, Docker/WSL, and browser-testing tools.
The existing test environment runs Grafana 13.2.2. Start the workspace development terminal using
`C:\Codex\Start-Dev.cmd`, then change into this checkout.

Docker/WSL is capped at 4 GB RAM and 4 processors, with 2 GB swap.
Run heavy builds sequentially and use one browser-test worker on this 16 GB PC.
The existing generic starter in `C:\Codex\projects\local-dashboard-panel` is a reference environment;
it is not the implementation of this traffic plugin.

## Implementation milestones

### 1. Confirm the metric contract

Resolve the data source, real exported names/labels, scrape interval, five-minute average versus peak,
and representative tunnel capacity. Approve the provisional plugin name/ID and choose a repository license.
Use sanitized examples; the public repository must not contain production tokens or SNMP credentials.

### 2. Scaffold the plugin

Use Grafana's official panel generator, then pin all Grafana runtime SDK packages to 13.2.2.
Use the React 19 line required by that SDK and commit the lockfile. Set the minimum Grafana version to 13.2.2.
Add a reproducible local server configuration and an example dashboard with synthetic metrics.
Do not copy local databases, package caches, installed tools, or node_modules into this repository.

### 3. Prove query integration

Validate that panel-owned instance/ifName options control requests through an existing Grafana data source.
Cover refresh, template variables, historical ranges, fixed 300-second history steps, cancellation, and missing data.
Implement the normalized data contract before building the visual layer.

### 4. Implement the compact visualization

Build the status/header overlay, capacity display, symmetric mirrored bars, readable axes, and central IN/OUT rates.
Add responsiveness, themes, tooltips, stale-data behavior, and accessibility from the product specification.

### 5. Validate and package

Implement [acceptance criteria](acceptance-criteria.md), type checks, lint, production builds, and browser tests.
Run against Grafana 13.2.2 and review dependency findings. Add CI when executable code exists.
Signing and distribution are separate release steps after the plugin identity and license are decided.

## Proposed code layout

```text
src/
  module.ts
  plugin.json
  options.ts
  components/
  query/
  data/
  format/
  chart/
tests/
  fixtures/
  e2e/
provisioning/
docs/
```

This is a planned structure, not a list of files already present.

## Documentation review checks

For this first revision, validate Markdown links, the SVG's XML structure, and `git diff --check`.
No application tests are claimed for a documentation-only repository.
