# Development plan

## Repository and workspace

- Remote: `https://github.com/urrizzz/grafana.git`; local branch `main`.
- Checkout: `C:\Codex\projects\grafana`.
- Documentation remains local; do not push until requested.
- No executable traffic plugin or build command exists in this repository yet.

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
4. **Implement visualization.** Responsive metadata overlay, blue/purple mirrored bars, symmetric autoscale,
   capacity, top-left state, retained history, red DOWN line, and central dashes for DOWN/UNKNOWN. No tooltips.
5. **Validate and package.** Execute the acceptance criteria on Grafana 13.2.2, test multiple 12-24-hour elements,
   check dependencies, and add build/CI appropriate to the verified delivery model.

Choose a license and final identity before distribution. Do not assume the standalone panel generator supplies
Canvas integration, and do not deploy a core modification without an explicit delivery decision.

## Documentation checks

Validate local Markdown links, SVG XML, consistency with confirmed decisions, encryption of changed files,
and `git diff --check`. No application tests are claimed for this documentation-only phase.
