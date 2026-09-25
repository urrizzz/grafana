# Separate diagram-panel concept

Open [the interactive mockup](assets/diagram-panel-mockup.html) in a browser.
This is a new exploration requested by the owner. It does not replace the
[accepted traffic component reference](design-reference.md), and does not constitute approval to
change the production host from built-in Canvas to this custom panel.

The idea is one installable Grafana panel providing its own free-placement diagram. It would contain router
representations and multiple compact traffic displays without modifying Grafana core. It is not an extension
inside Grafana's built-in Canvas. No plugin code, live backend, or Grafana installation change is included here.

## Try it

- Drag a router card or the grip above a traffic element; the background grid is visual, not a placement constraint.
- Select an element to edit its name and settings on the right.
- Resize a traffic plot with its selected corner handle or width slider (120-240 pixels).
- Change the mock status to compare UP, DOWN and UNKNOWN. Hover a graph to inspect a five-minute interval.
- Add router/traffic elements and choose endpoints; diagram connections follow router movement.
- Switch editing off to inspect the operator view; zoom and scroll to navigate.
- Save locally to persist this demo in this browser, or export its layout as JSON. Reset restores the initial demo.

Router and interface settings demonstrate the intended configuration experience but do not fetch metrics.
Each state uses the existing wireframe's fictional data, so independent settings do not imply independently
queried live traffic yet. Metadata capacity in this preview is illustrative (100 Mbit/s). Hover derives values
from static SVG geometry only in this mockup; the implementation must use normalized source data.

The future plugin would save options and positions with the Grafana dashboard rather than browser storage.
Connections here are simple router-to-router lines with configured endpoints, not a full network editor.
The current scope is a visual/interaction mockup, not a promise of all Canvas features.

The existing scalable-wireframe.html and its assets remain unchanged. This new mockup reuses the component's
visual style in a separate surrounding diagram layout. [Screenshot](assets/diagram-panel-mockup.png).
