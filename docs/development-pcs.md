# Development and deployment on both PCs

Both PCs are supported development environments for the same repository, plugin ID
`urrizzz-interfacemap-panel`, Grafana Enterprise **13.2.2**, and mock dashboard on
http://localhost:3001/d/network-map-data-dev. Their dashboards and Docker databases are local and independent.

## Machine profiles

| Setting | Owner PC | Yuri PC |
| --- | --- | --- |
| Checkout | `C:\code\grafana` | `C:\Codex\projects\grafana` |
| Node 24 / npm | `C:\code\.tools\grafana\node-v24.21.0-win-x64` | `C:\Codex\tools\node` |
| Python | Installed Python 3.11.9 on PATH | `C:\Codex\.venv\Scripts\python.exe` |
| Git | Installed Git on PATH; repository selects `urrizzz` | `C:\Codex\tools\git\cmd\git.exe` |
| Playwright browsers | `C:\code\.tools\playwright` | `C:\Codex\tools\playwright` |
| Docker CLI | `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin` | `C:\Program Files\Docker\Docker\resources\bin` |
| Filesystem | Current `C:\code` workspace | EFS-encrypted project; run as `DESKTOP-F40GD5I\Yuri` |
| Docker storage | Existing Docker Desktop configuration | Unencrypted Docker storage under `C:\Codex\docker-storage` |
| Database | Named volume `interface-map-dev_grafana-data` | Existing container may still contain its database in its writable layer |

Preserve each PC's Docker/WSL configuration and other projects. The Yuri PC's recorded global limit is
4 GiB RAM / 4 CPUs / 2 GiB swap; do not copy that setting onto the Owner PC. The project container uses
1 GiB / one CPU with GOMEMLIMIT 300 MiB on both. Keep heavy checks sequential and one browser worker.

On the Yuri PC, do not decrypt project files, export keys, grant another account EFS access, or stage
plaintext copies. The Docker storage exception does not apply to ordinary project files or backups.

## Prerequisites and setup

Install Git, Python 3, Docker Desktop with Linux containers, and Node **24** if absent. Start Docker Desktop.
Reuse the tool directories above when they exist. The Owner PC uses the official portable Node 24.21.0
Windows x64 ZIP, verified against Node's official SHASUMS256.txt, without changing system Node 20.
The Yuri PC already has Node 24; do not replace working tools unnecessarily.

From the appropriate checkout, load the machine's tools into the current PowerShell session:

```powershell
. .\dev\Use-DevTools.ps1 -Machine Owner
# On the Yuri PC, use -Machine Yuri instead. Auto detects the documented checkout paths.
```

For a fresh checkout, install the locked dependencies and browser, build, and start the review instance:

```powershell
.\dev\Start-Review.ps1 -Machine Owner -InstallDependencies -InstallBrowser
# Yuri: .\dev\Start-Review.ps1 -Machine Yuri -InstallDependencies -InstallBrowser
```

The scripts change only the current process environment. They do not install system software, modify
global PATH, change Git credentials, or alter Docker/WSL resource settings. Missing tools produce an error.
An npm network reset can be retried with `npm.cmd ci --prefer-offline --maxsockets=3 --fetch-retries=5`.

## Deploy updates and review

After receiving code updates, reinstall dependencies only if the lockfile changed. Run:

```powershell
. .\dev\Use-DevTools.ps1
npm.cmd run check
python -m unittest discover -s dev -p 'test_*.py'
.\dev\Start-Review.ps1 -SkipBuild
npm.cmd run e2e
```

For a normal rebuild/deploy, `.\dev\Start-Review.ps1` builds and restarts Grafana. It uses Compose to
create an instance only when no project container exists. Existing containers are restarted directly,
without recreation, so the Yuri PC's original database is preserved even after pulling the newer Compose file.
An existing image other than 13.2.2 is rejected for manual review. Health must report database ok and 13.2.2.

Open the dashboard without signing in. Keep **2026-09-25 00:00-12:00 UTC** and the **Network Map Mock Frames**
datasource. The committed A-H TestData queries require no VictoriaMetrics server or exporter.
Switching datasources may replace queries; selecting the mock datasource again does not restore them.
Open panel menu > Edit. Hover shows subtle move/resize buttons; selection keeps them fully visible.
Drag either button to move or resize, then Back > Save to persist edits.
Refresh the browser after deployment to pick up the bumped plugin version.

Use `docker compose stop` / `docker compose start` for daily stop/start. Never use `compose down -v`,
delete the named volume, or recreate the Yuri PC's legacy container without backing up its database first.
The Owner PC resumes with Docker Desktop through `restart: unless-stopped`; the legacy Yuri container
retains its existing restart policy until deliberately migrated.

## Backups and moving between PCs

Git carries source, build configuration, Compose, provisioning and mock fixtures. It does not carry
node_modules, dist, credentials, local dashboards or the Grafana database. Rebuild dist on each PC.
Export desired dashboards through Grafana's JSON export and import them on the other PC, preserving query
definitions and time ranges; review UID conflicts before replacing an existing dashboard. Keep private
exports under ignored backups/ and follow the Yuri PC's EFS requirements.

Before migrating a legacy container to the named volume, stop it and copy `/var/lib/grafana/grafana.db`
into an encrypted backup on the Yuri PC. Verify that backup and export any other required local settings
before planning a volume migration. The launcher intentionally performs no automatic database migration.

## Verification status

The Owner PC is available for execution and browser validation. The Yuri profile preserves the documented
paths and constraints; this session has no access to that PC and does not claim a fresh deployment there.
See [current state](current-state.md) for the latest implementation version and actual test results.
