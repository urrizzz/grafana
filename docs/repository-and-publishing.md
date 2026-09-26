# Repository reference and publishing plan

Researched 2026-09-25. The root panel scaffold now exists; the M1-M3 editor, adapter and renderer are implemented, locally tested and owner-accepted; real backend validation and publication remain pending.

## Inspected references

[Flow](https://github.com/andymchugh/andrewbmchugh-flow-panel) is a published diagram plugin. Its repository
separates source, examples, provisioned dashboards, build configuration, tests, and release automation.
Its SVG/YAML authoring workflow differs from our required built-in router/traffic editor. Use its project
organization as a reference; retain our accepted design and no-script configuration.

Directly inspected files:

- [package.json](https://github.com/andymchugh/andrewbmchugh-flow-panel/blob/main/package.json): version 1.20.1, Grafana 10 packages, React 18, TypeScript 4.8, Jest and Cypress-based tests.
- [plugin.json](https://github.com/andymchugh/andrewbmchugh-flow-panel/blob/main/src/plugin.json): panel identity, compatibility, logo, screenshots, documentation links, build-time version/date.
- [release workflow](https://github.com/andymchugh/andrewbmchugh-flow-panel/blob/main/.github/workflows/release.yml): version-tag packaging; signing configuration is commented out in the inspected file.

These facts do not establish Flow compatibility with our Grafana 13.2.2 target. Do not copy its dependency
versions or assume its workflow is our ready-to-use release pipeline. Its Apache-2.0 license does not select
a license for this project.

Use the [official basic panel example](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/panel-basic)
and [create-plugin tooling](https://github.com/grafana/plugin-tools/tree/main/packages/create-plugin) for the
scaffold. The inspected official package uses TypeScript, Jest, Playwright, a lockfile, and standard build,
typecheck, lint, server and signing scripts. Its current package requires Node >=22 and uses Grafana 13.1
packages: still validate dependency/runtime compatibility against our exact 13.2.2 target.
The example README includes older API-key instructions; use the current signing documentation below instead.

## Repository layout in urrizzz/grafana

Keep the existing repository and history. Put the plugin at its root so standard Grafana automation can
find package.json without special subdirectory configuration. Preserve docs/assets and dev/mock_metrics.py.

```text
.github/workflows/       CI checks and manual unsigned development packaging
.config/                Generated Grafana build configuration
src/
  plugin.json           Plugin identity, metadata, tested compatibility
  module.ts             PanelPlugin registration
  types.ts              Schema-1 diagram, dimensions, visibility and data mappings
  components/           Layout editor and compact SVG traffic renderer
  diagram/              Saved model, operations and facing-side routing
  data/                 PanelData adapter, normalization and channel index
  img/                  Plugin logo; actual plugin screenshots to follow
  README.md             Packaged plugin usage documentation
tests/                  Playwright layout, data, renderer and persistence checks
provisioning/           Development dashboards and built-in TestData datasource
docs/                   Existing requirements, references and research
dev/                    Existing synthetic IF-MIB data tools
package.json            Build/test/sign scripts and dependencies
package-lock.json       Reproducible dependency installation
docker-compose.yaml     Local plugin development on Grafana 13.2.2
CHANGELOG.md            Release history
LICENSE                 Explicit notice that project license is not yet selected
```

The scaffold reuses the existing official create-plugin 7.11.0 tooling and 13.2.2 dependency lockfile.
The original documentation, mockups, mock metrics and Git history are preserved. Keep dist, node_modules, credentials and generated metric data out
of source control. Put downloadable plugin ZIPs in GitHub Releases rather than committing them to main.

CI runs npm ci, type checking, lint, meaningful unit tests, a production build, and browser checks
against Grafana 13.2.2. Browser coverage includes loading, editor/routing, saved layouts, compact rendering and synthetic data.
Real VictoriaMetrics query validation remains M5 work. Use one browser worker locally and keep existing WSL memory limits.

## Two publishing destinations

A GitHub release hosts a versioned installation artifact. It does not itself sign the plugin or list it in
Grafana's catalog. Catalog publication adds Grafana review and discoverability.

### Build and GitHub release

1. Set the plugin ID, display name, license, version, documentation, screenshots and tested compatibility.
2. Build the actual plugin, run the checks, and run Grafana's plugin validator. Existing mockups are not a release.
3. Package compiled output in a ZIP whose top-level directory is the plugin ID. Do not submit GitHub's automatic source ZIP as the installable artifact.
4. Use the official version-tag release workflow to produce a draft GitHub release with the plugin ZIP and checksums. Review and publish the draft when the release is ready.

Use a reviewed, pinned build action and lockfile. The intended flow is a version update, passing CI, and a
vX.Y.Z tag. A normal push to main runs CI without publishing. Current package.yml is a manual development-artifact
workflow; there is no tag-triggered public release workflow or signing secret yet. See [build automation](https://grafana.com/developers/plugin-tools/publish-a-plugin/build-automation)
and [packaging](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin).

### Grafana public catalog

Use a Grafana Cloud organization account with administrator access. Submit the artifact URL, public source
URL, requested ZIP SHA1, and testing instructions through Org Settings > My Plugins > Submit New Plugin.
Include reproducible demo provisioning and synthetic data; do not depend on production-router access.
Grafana performs automated validation and manual review. Updates also require submission and review.
The catalog is free. See [publication instructions](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin).

The first public review submission may be unsigned. Once approved and assigned a signature level, use the
Grafana signing tool for public builds. Signing generates dist/MANIFEST.txt; package the signed output
without modifying its contents afterwards. Configure an Access Policy token with plugins:write, held in
GitHub Actions secrets as GRAFANA_ACCESS_POLICY_TOKEN, for release signing. No token belongs in the repo.
See [current signing instructions](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin).

### Internal deployment before public release

Development can load unsigned plugins in the configured development environment. For deployment restricted
to your organization, private signing uses the intended Grafana root URLs. This is a separate distribution
route from a public catalog listing; do not assume a private signature permits general distribution.
The signature root URLs must match the installation configuration. See the same signing guide.

## Confirmed development identity and remaining release decisions

- Grafana Cloud organization slug: the plugin ID prefix must match it, which is not automatically your GitHub username.
- Use provisional ID `urrizzz-interfacemap-panel` now. The owner has no Grafana Cloud organization yet. Local development does not require one. Confirm or replace the prefix before signing/publishing.
- Development display name: Network Traffic Map.
- Choose a project license before distribution; the package is currently private and UNLICENSED.
- Decide whether first deployment is private/internal or a public Community catalog submission.

Our Grafana remains unmodified; installation still requires permission to install a plugin. The custom
diagram editor, datasource-independent adapter and renderer are implemented. M4-M5 validation and the
identity/license/distribution decisions remain prerequisites to a release.
