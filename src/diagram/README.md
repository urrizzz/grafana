# Diagram model and operations

model.ts validates schema-1 saved options, supports legacy empty options and implements safe removal,
element duplication and labeled development fixtures. routing.ts chooses facing endpoints from box bounds.
model.test.ts covers invalid references, migration, independent copies and connection directions.
The editor writes diagram options through Grafana onOptionsChange; transient UI state is not persisted.
See ../../docs/implementation-plan.md and ../../docs/current-state.md for implementation boundaries.
