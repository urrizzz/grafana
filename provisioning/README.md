# Local development provisioning

The dashboard displays the development shell, without a data source or real metrics.
Run npm run build then npm run server. Open http://localhost:3001/d/interface-map-dev.
Port 3000 and the existing Grafana data directory are not used by this Compose project.
Anonymous admin is for this loopback-bound development instance only.
Container state is disposable; export wanted dashboard changes before stopping/removing it.
Stop the instance with npm run server:stop to release memory.
