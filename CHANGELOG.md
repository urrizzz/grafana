# Changelog

## 0.3.1 - Unreleased

- Default unset traffic blocks to compact mode with the channel name centered above the graph.
- Remove the tiny current-window caption and strengthen exact-time outage segments; show outage times on hover.

## 0.3.0 - Unreleased

- Render native 120 x 70 mirrored traffic bars, shared automatic axes and range-end values.
- Preserve historical traffic and draw red segments only during observed outages.
- Add time-bucket hover with source values in an external, unscaled tooltip.
- Add per-block Show interface details, field visibility and internal status circles when hidden.
- Extend both reference mockups and renderer/save-reload regression coverage.
- IF-MIB query presets and real backend/performance validation remain later milestones.

## 0.2.0 - Unreleased

- Add datasource-independent frame mappings and router/channel selection from query results.
- Read interface metadata from results; normalize range-end rates, status, capacity and historical outages.
- Report ambiguous identities, missing data, resolution and source-quality limitations.
- Support single-valued variables; reject multi/All selections and retain unavailable selections.
- Add an isolated reproducible TestData dashboard and M2 adapter/browser validation.
- Final traffic bars, axes, hover and hidden interface details remain planned for M3/M4.

## 0.1.5 - Unreleased

- Rename the visualization to Network Traffic Map; retain the existing plugin ID for dashboard compatibility.
- Follow Grafana panel editing automatically, with read-only dashboard views and native Save/Discard.
- Use Grafana dropdowns, support 25%-150% zoom, and show compact dismissible warnings without layout shift.
- Complete owner validation of M1 and maintain implementation/current-state documents.

## 0.1.0 - Unreleased

- Add standard Grafana panel build structure, provisional ID and development shell.
- Preserve accepted diagram/traffic mockups, requirements and synthetic IF-MIB tools.
- Add isolated development provisioning, scaffold smoke checks and CI.
- Add the M1 saved diagram model/editor, automatic connection routing, safe deletion and element duplication.
- Add layout persistence, zoom/drag/resize and native panel-duplication browser checks.
- Disable optional background plugin installation and constrain the Go memory target in local development.
- Datasource-independent frame mapping and traffic visualization remain pending.
