# M1 layout editor validation

Movement update (0.3.3): in panel edit mode, move both routers and traffic using the four-way arrow
handle above their top-right edge. Body clicks select only. Connections follow routers automatically.

This checks the real plugin's layout editor, not the HTML mockup. Traffic values and result-driven channel
selection are intentionally absent until M2/M3. Fixture identity fields are editable text for this milestone.

## Open the editor

Start the development server with `dev/Start-Review.ps1` (see [both PC profiles](development-pcs.md)) and open
[Network Traffic Map development](http://localhost:3001/d/interface-map-dev). Open the panel's three-dot menu and choose **Edit**. Layout controls appear automatically. Choose **Load fixture layout** on an empty diagram.
The fixture contains two routers, one traffic placeholder and a connection. Alternatively add each element
using the toolbar. The provisioned dashboard allows UI updates; normal Grafana dashboard Save persists them.

## Checklist

Owner-confirmed on 2026-09-25 (remaining unchecked items are pending):

- [x] Normal dashboard view prevents moving routers.
- [x] Dashboard Edit allows moving whole panels while internal routers stay locked.
- [x] Edit visualization automatically shows layout controls and enables router movement.

- [x] Add router creates a new router and opens its settings (owner confirmed).
- [x] Edit the new router name/instance, select another router, and select it again. The fields retain your values (owner confirmed).
- [x] Add traffic creates a component bound to the selected router (owner confirmed).
- [ ] Manual channel/alias/description validation superseded by owner requirement: read metadata from query results in M2/M4; panel-level mappings, no manual metadata entry in the finished plugin.
- [x] Drag routers and traffic independently. The traffic channel stays bound to its configured router.
- [x] Move connected routers left/right and above/below each other. Lines update during dragging and attach
  to the facing box sides. Bends do not run through the two endpoint boxes.
- [x] Overlap connected boxes: their line is hidden. Separate them: the line returns. Unrelated obstacles
  are not automatically avoided in this milestone.
- [x] Select a connection in Element settings and change endpoints. Selecting the same router for both ends
  shows an error and preserves the previous valid connection.
- [x] Select traffic and resize using its corner handle or Graph width slider. Width stays between 120 and
  360 pixels and plot height keeps the 120:70 ratio. Channel information remains separately readable.
- [x] At the original 75%, 100% and 125% zoom, drag again and scroll the diagram. Elements track the pointer and connections stay attached.
- [x] Duplicate a router or traffic element. Move/edit the copy; the original does not change. Duplicating a
  router does not also copy its connections or traffic.
- [x] Try removing a referenced router. An explanation asks you to remove/reassign dependent traffic and
  connections first. After doing that, router removal succeeds. No automatic rebinding occurs.
- [x] Click Grafana **Back**. Inspector and drag/resize controls disappear; dragging on a box no longer moves it.
- [x] Save the Grafana dashboard and reload: the moved router retains its position.
- [x] Verify saved traffic positions, sizes, names, identities and connections after reload.
  The normal dashboard stays read-only, including while editing its grid. Reopening the panel editor automatically enables layout controls.
- [x] Duplicate the Grafana panel, edit only one copy, save and reload. Layouts remain independent.

- [x] Reopen the panel editor, move a router, then click **Discard**. The router returns to its saved position (owner confirmed).

## Expected limits

Traffic shows UNKNOWN and dashes because no metrics are connected. No bars or historical hover are expected
in M1. Fixture names do not query any router. Deleting all routers offers the fixture button again; it never
replaces a nonempty diagram. Unsupported/malformed saved options show an error rather than overwrite data.

Export wanted dashboards before changing provisioning. The current PC uses a named Docker volume for
the database; never delete it or use `compose down -v`. Normal browser reload and server restart are
different checks from recreating the container. The development service uses loopback port 3001.

Report the checklist item, expected/actual behavior and whether it occurred before or after save/reload.
User validation is pending until the owner reports the result; automated checks are recorded in current-state.md.

## Owner review outcome (2026-09-25)

Owner passed remaining checks 2-11, including routing, overlap, endpoint validation, resize, original zoom
levels, duplication, protected removal and persistence. Check 1 clarified result-derived metadata for
M2/M4 instead of validating manual fixture fields. Protected removal works, but its message visibility
and lifetime need improvement. Follow-up owner checks:

- [x] Verify added 25%, 50% and 150% zoom levels (owner confirmed).
- [x] Trigger blocked removal: warning is a compact overlay that does not shift or shrink the diagram, Dismiss clears it, and changing
  selection or successfully editing an element clears it too.

Owner confirmed all works after the compact-warning correction. M1 owner validation is complete;
result-derived metadata remains planned M2/M4 work, not a failed M1 check.
