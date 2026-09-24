# Development plan

## Repository and workspace

- Remote: `https://github.com/urrizzz/grafana.git`; local branch `main`.
- Checkout: `C:\Codex\projects\grafana`.
- Documentation remains local; do not push until requested.
- The visualization plugin is not implemented. A runnable [mock metrics exporter](mock-metrics.md) and tests are available.

Existing workspace tooling includes Node/npm, Git, Python, Docker/WSL, and browser-testing tools.
The generic starter in `C:\Codex\projects\local-dashboard-panel` is a reference, not this implementation.
Target Grafana 13.2.2. Keep the existing 4 GB RAM / 4 CPU / 2 GB swap WSL limits; run heavy builds sequentially
and browser tests with one worker on this 16 GB PC.

## Encrypted workspace

Project files must remain EFS-encrypted. When sandbox access is denied, use supported approved execution,
verify `whoami` is `DESKTOP-F40GD5I\Yuri`, then access files directly as Yuri.
Do not decrypt files, export keys, grant sandbox accounts EFS access, or stage plaintext copies.
Keep startup access instructions outside the encrypted workspace.
The authorized exception is `C:\Codex\docker-storage`: Docker-managed virtual disks/images/volumes/build cache
remain unencrypted there. Do not apply EFS to that directory. Projects and directly mounted data elsewhere remain encrypted.

## Implementation milestones

1. **Prove built-in Canvas integration.** Inspect the exact version, register/render/persist a minimal element,
   and establish whether this can be supported without modifying Grafana core. Record results before selecting packaging.
2. **Inspect source data.** Capture sanitized labels/metadata for a port and tunnel and record the installed
   VictoriaMetrics data-source plugin ID/version. Collection interval and rate meaning are already confirmed.
3. **Prove queries.** Independently select multiple channels, interpolate variables, customize mappings, and follow
   dashboard range/refresh. Validate 300-second history, current rates, resets, freshness, cancellation, and error handling.
4. **Implement visualization.** Design for very small placement from the start. Scale the full component,
   including traffic fonts, spacing, bars, axes and overlays, while preserving relative layout.
   Include blue/purple mirrored bars, symmetric autoscale, capacity, right-hand state, retained history,
   red segments for historical DOWN intervals, and central dashes for DOWN/UNKNOWN. No tooltips or dashboard-author scripts.
   Expose ordinary settings for selectors, mappings and visibility; no per-size font tuning is required.
5. **Validate and package.** Execute the acceptance criteria on Grafana 13.2.2, test multiple 12-24-hour elements,
   proportional reductions and independent width/height changes, including long metadata and every state.
   Check dependencies, and add build/CI appropriate to the verified delivery model.

Choose a license and final identity before distribution. Do not assume the standalone panel generator supplies
Canvas integration, and do not deploy a core modification without an explicit delivery decision.

The bars must remain clearly visible at native size. Use matching blue/purple current numbers with contrast
protection. Validate recovered outages and missing status against historical status queries, not just the
range-end badge.

## Documentation checks

Validate local Markdown links, SVG XML, consistency with confirmed decisions, encryption of changed files,
and `git diff --check`. Mock exporter tests cover counter behavior and history consistency; visualization and Canvas integration tests remain pending.

## Revised compact layout

The primary traffic area is 120 x 70 CSS pixels. Design readable IN/OUT values at that native size
and scale upward proportionally. Put identity fields, status and capacity in a separate block to its right,
with readable independent typography. The block consumes additional space. This supersedes whole-card
downscaling and metadata/status/capacity overlays inside the graph. Keep the blocks bound to the same
interface; validate placement and lifecycle together in the eventual Canvas integration.
