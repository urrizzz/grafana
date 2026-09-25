# Development working references

For a new session, start with docs/agent-handoff.md. Before implementing changes, read docs/current-state.md and docs/implementation-plan.md, then consult
the relevant product requirements and acceptance criteria. Use docs/development.md for environment,
commands and EFS access rules. User instructions take precedence over these working documents.

Follow the plan's dependencies and completion gates. Update docs/current-state.md with meaningful
implementation changes, verification results, limitations and the next concrete action. Update the plan
when scope or sequencing changes; update requirements when agreed behavior changes. Do not claim that
mockup behavior is implemented in the Grafana plugin or that a committed CI workflow has passed remotely.

The accepted design uses Grafana panel-level queries and result-driven router/channel selection.
Do not revive the superseded datasource-specific query coordinator or built-in Canvas integration plans.

## Required documentation maintenance

For every development change, update docs/current-state.md in the same task before reporting completion.
Keep its current-position summary and tables accurate, not just its appended history. Record the running
version, implemented behavior, checks actually run and their results, remaining limitations, owner
validation status, next step, and whether changes are local, committed or pushed when those facts change.
Update affected requirements, decisions, implementation-plan.md and validation/development instructions
alongside behavior, scope or workflow changes. Clearly label superseded historical guidance and mockup
behavior. Before finishing, check affected documents for stale or contradictory statements. Documentation
maintenance is part of completion, not a separate task requiring a reminder from the owner.
