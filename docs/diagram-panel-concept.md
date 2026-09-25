# Accepted diagram panel workflow

Project status: the M1 layout editor is implemented under provisional ID `urrizzz-interfacemap-panel`.
Traffic elements are placeholders; returned-data mapping and live traffic rendering remain pending.
See [current state](current-state.md) for verification and [M1 validation](m1-validation.md) for review.

Open [the interactive mockup](assets/diagram-panel-mockup.html) in a browser.
The owner approved this custom diagram approach. It supersedes the original built-in Canvas host
requirement and complements the [accepted traffic component reference](design-reference.md).

The agreed approach is one installable Grafana panel providing its own free-placement diagram. It would contain router
representations and multiple compact traffic displays without modifying Grafana core. It is not an extension
inside Grafana's built-in Canvas. No plugin code, live backend, or Grafana installation change is included here.

## Try it

- Drag a router card or the grip above a traffic element; the background grid is visual, not a placement constraint.
- Select an element to edit its name and settings on the right.
- Resize a traffic plot with its selected corner handle or width slider (120-240 pixels).
- Change the mock status to compare UP, DOWN and UNKNOWN. Hover a graph to inspect a five-minute interval.
- Add router/traffic elements and choose endpoints; diagram connections update during dragging and automatically attach to facing left/right/top/bottom box edges.
- Switch editing off to inspect the operator view; zoom and scroll to navigate.
- Save locally to persist this demo in this browser, or export its layout as JSON. Reset restores the initial demo.

Router and interface settings demonstrate the intended configuration experience but do not fetch metrics.
Each state uses the existing wireframe's fictional data, so independent settings do not imply independently
queried live traffic yet. Metadata capacity in this preview is illustrative (100 Mbit/s). Hover derives values
from static SVG geometry only in this mockup; the implementation must use normalized source data.

The implemented plugin must save options and positions with the Grafana dashboard rather than browser storage.
Connections here are simple router-to-router lines with configured endpoints, not a full network editor.
The current scope is a visual/interaction mockup, not a promise of all Canvas features.

The original component wireframe remains the accepted component reference. Both mockups now share the
status-colored graph border: green UP, red DOWN, gray UNKNOWN. The border reflects current status;
historical red center-line segments retain their original time-localized meaning. This mockup reuses the component's
visual style in a separate surrounding diagram layout. [Screenshot](assets/diagram-panel-mockup.png).

## Connection routing reference

The mockup uses orthogonal lines attached to the centers of facing box edges. It selects horizontal or
vertical routing using the larger clear gap between router rectangles, with deterministic horizontal ties.
It measures actual router-card dimensions and recomputes paths during movement. Moving a traffic card
alone does not change the router endpoints. Overlapping/touching endpoints or self-connections are not
drawn; separating the boxes restores the line. Missing endpoints are skipped. Automatic avoidance of
unrelated routers, traffic cards, and other lines is not demonstrated by this routing rule.

## Agreed data-selection workflow

Configure the datasource and one or more queries in Grafana's normal panel query editor to return all
required routers/channels. Each traffic element then selects its router and channel from those results,
using configurable identity fields (instance/ifName by default). Elements do not issue queries.
An absent saved channel stays in place as UNKNOWN/no data. The mockup still uses fictional, editable
labels; its selectors do not demonstrate real result discovery yet.
