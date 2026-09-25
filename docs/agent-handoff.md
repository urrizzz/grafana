# Agent handoff

Updated 2026-09-25 for plugin 0.3.5, implementation `48123ec` and the accompanying documentation commit.
Read repository AGENTS.md, [current state](current-state.md), [plan](implementation-plan.md), then
[product spec](product-spec.md) and [metrics contract](metrics-contract.md). This file is the startup guide,
not a competing requirements source. M3 final owner acceptance remains pending; M4 is the next implementation milestone.

## Workspace and tools

Checkout: `C:\Codex\projects\grafana`, branch main, origin `https://github.com/urrizzz/grafana.git`.
Files are EFS encrypted. Use supported approved execution as Yuri when sandbox access fails; verify
`whoami` returns `DESKTOP-F40GD5I\Yuri` before access. Do not decrypt, export keys or stage plaintext copies.
Docker-managed storage under `C:\Codex\docker-storage` is the authorized unencrypted exception.

```powershell
$env:PATH='C:\Codex\tools\node;'+$env:PATH
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Codex\tools\playwright'
& C:\Codex\tools\git\cmd\git.exe status --short
& C:\Codex\tools\node\npm.cmd run check
& C:\Codex\.venv\Scripts\python.exe -m unittest discover -s dev -p 'test_*.py'
& C:\Codex\tools\node\npm.cmd run e2e
```

Commands assume the checkout working directory and installed dependencies. Run heavy commands sequentially;
browser config already uses one worker. Do not reinstall the available browser unnecessarily.
Build before loading Grafana. Use the existing Docker binary at
`C:\Program Files\Docker\Docker\resources\bin\docker.exe` and container `interface-map-dev-grafana-1`.
Restart (do not recreate) after changing plugin metadata/version, then wait for
`http://127.0.0.1:3001/api/health` to report database ok. The disposable container has saved owner dashboards;
`compose down` or recreation can lose them. Preserve backups before any such operation.

## Code map

| File | Responsibility |
| --- | --- |
| src/components/InterfaceMapPanel.tsx | Native edit mode, selections, common move/resize controls, diagram rendering and options updates |
| src/components/TrafficPlot.tsx | SVG bars, circles, outage segments and external hover tooltip |
| src/components/trafficGeometry.ts | Scale, decimal units, UTC buckets and timezone labels |
| src/data/adapter.ts and model.ts | Frame-role mapping, channel index, quality/status/rate normalization |
| src/types.ts and src/diagram/model.ts | Schema-1 validation, optional dimensions/visibility, duplication and removal |
| src/diagram/routing.ts | Facing-side orthogonal routes from actual boxes |
| src/module.ts | Grafana panel registration and result-mapping option editors |
| dev/generate_frame_demo.py | Deterministic TestData rates and consistent historical status |
| provisioning/dashboards/data-preview.json | Fixed-range mock query fixture |
| tests/layout.spec.ts, data.spec.ts, traffic.spec.ts | Real Grafana editor, result integration and rendering scenarios |

## Preserve these boundaries and local state

- Plugin ID stays `urrizzz-interfacemap-panel`; display name is Network Traffic Map.
- Do not modify Grafana core or attempt embedding this panel as a native Canvas element.
- All queries belong to Grafana's panel query editor. A-H default roles are IN/OUT history, IN/OUT current,
  status history/current, capacity and metadata. Rates arrive in bit/s; ifHighSpeed is converted from Mbit/s once.
- Mapping and identity defaults are configurable. Ambiguous/absent identities must not borrow other channels' data.
- Mock fixture timestamps are fixed. Changing the dashboard range without changing data can correctly show UNKNOWN.
- Switching datasource may replace Grafana query targets; selecting the mock datasource again does not restore A-H.
- Before regenerating provisioned JSON, back up saved owner options/queries/time. Do not replace their dashboard
  with a test fixture. Tests use dedicated UIDs; `network-map-m3-render-check` is disposable, whereas
  `network-map-data-dev` and the existing `network-map-m3-graphs` comparison should be preserved.
- Version bumps must edit ONLY package.json version and package-lock.json root / packages[""].version.
  Never globally replace version strings: dependency versions were previously corrupted that way and repaired.
- Grafana caches module.js by plugin version. Rebuild/restart after a version bump; Ctrl+F5 can clear an older bundle.
- Router dimensions are optional for legacy schema 1. Use the 150 x 64 fallback consistently in rendering,
  handles, routing and bounds. Respect 120-600 x 48-320 router bounds and 120-360 proportional traffic width.
- HTML mockups use localStorage and simplified fixtures. They are references, not runtime code or backend evidence.

## Next work and verification

Current owner checklist: [M3 validation](m3-validation.md). The accepted M1/M2 history does not imply final
M3 approval. After acceptance, follow M4 query-preset API investigation and implementation in the plan.
Do not start signing/publication, change the permanent ID or claim real-backend readiness without evidence.
See the current-state verification table before repeating tests. Run relevant checks for new code changes;
report actual failures and focused reruns. Historical results live in [development history](development-history.md).

This handoff and implementation are intended for origin/main. Verify `git status`, `git log` and remote HEAD
when resuming; a Git push is not evidence of a passing remote CI run or a signed plugin release.
