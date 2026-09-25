import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { PanelProps } from '@grafana/data';
import { getTemplateSrv, locationService } from '@grafana/runtime';
import { Combobox, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { Connection, Diagram, InterfaceMapOptions, RouterNode, TrafficNode } from '../types';
import { duplicateElement, fixtureDiagram, newId, readDiagram, removeElement } from '../diagram/model';
import { TrafficPlot, statusColors } from './TrafficPlot';
import { formatRate } from './trafficGeometry';
import { adaptFrames, resolveIdentity } from '../data/adapter';
import { channelKey } from '../data/model';
import { routeConnection } from '../diagram/routing';

const styles = css`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  [data-map-control] {
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid #70839a;
    border-radius: 4px;
    padding: 5px 8px;
  }
  button[data-map-control] {
    cursor: pointer;
  }
  button[data-map-control]:disabled {
    opacity: 0.45;
    cursor: default;
  }
  [data-map-control]:focus-visible {
    outline: 2px solid #439aff;
  }
  [data-map-field] {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    min-width: 0;
  }
  input[data-map-control] {
    width: 100%;
    min-width: 0;
  }
  .zoom-field {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .zoom-control {
    width: 104px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .notice {
    position: absolute;
    top: 8px;
    right: 228px;
    z-index: 2;
    width: 340px;
    max-width: calc(100% - 236px);
    max-height: 110px;
    overflow: auto;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 12px;
    line-height: 18px;
    box-shadow: 0 2px 8px #0004;
  }
  .notice button {
    flex-shrink: 0;
  }
  .layout {
    position: relative;
    display: flex;
    min-height: 180px;
    flex: 1;
    overflow: hidden;
  }
  .viewport {
    flex: 1;
    overflow: auto;
    min-width: 160px;
    background: var(--map-background);
  }
  .world {
    position: relative;
    transform-origin: 0 0;
    background-image: radial-gradient(var(--map-grid) 0.8px, transparent 0.8px);
    background-size: 16px 16px;
  }
  aside {
    width: 220px;
    flex-shrink: 0;
    overflow: auto;
    padding: 10px;
  }
  .node {
    position: absolute;
    color: var(--map-text);
    user-select: none;
  }
  .selected {
    outline: 1px dashed #77adff;
    outline-offset: 5px;
  }
  .router {
    width: 150px;
    height: 64px;
    border: 1px solid #557599;
    border-radius: 8px;
    background: var(--map-router);
    padding: 8px;
    overflow: hidden;
  }
  .node .muted {
    color: var(--map-muted);
    opacity: 1;
  }
  .router strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .handle {
    cursor: grab;
    touch-action: none;
  }
  .traffic {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .plot {
    border: 1px solid #a4afbf;
    border-radius: 3px;
    background: #141e2b;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .info {
    width: 160px;
    font-size: 11px;
    overflow-wrap: anywhere;
  }
  .info strong {
    font-size: 12px;
  }
  .grip {
    position: absolute;
    top: -24px;
    left: 0;
    font-size: 11px;
  }
  .resize {
    position: absolute;
    right: -6px;
    bottom: -6px;
    touch-action: none;
    cursor: nwse-resize;
  }
  .muted {
    font-size: 11px;
    opacity: 0.8;
  }
`;

type Drag = {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  resize: boolean;
  snapshot: Diagram;
};

export function InterfaceMapPanel(props: PanelProps<InterfaceMapOptions>) {
  // Keep hooks in the editor stable even when saved options are invalid.
  let diagram: Diagram | undefined;
  let message = '';
  try {
    diagram = readDiagram(props.options);
  } catch (error) {
    message = error instanceof Error ? error.message : 'Invalid saved diagram';
  }
  return diagram ? <DiagramEditor {...props} diagram={diagram} /> : <div role="alert">{message}</div>;
}

function DiagramEditor({
  id,
  options,
  onOptionsChange,
  diagram,
  data,
  timeRange,
  replaceVariables,
  timeZone,
}: PanelProps<InterfaceMapOptions> & { diagram: Diagram }) {
  const theme = useTheme2();
  const index = useMemo(
    () => adaptFrames(data, options.mapping, timeRange.from.valueOf(), timeRange.to.valueOf()),
    [data, options.mapping, timeRange]
  );
  const channels = [...index.channels.values()];
  const routerIdentities = [...new Set(channels.map((channel) => channel.instance))].sort();
  const resolve = (value: string) => resolveIdentity(value, replaceVariables, getTemplateSrv().getVariables());
  const channelData = (node: TrafficNode) => {
    const instance = resolve(diagram.routers.find((router) => router.id === node.routerId)?.instance ?? '');
    const channel = resolve(node.ifName);
    return instance && channel ? index.channels.get(channelKey(instance, channel)) : undefined;
  };
  const identityPicker = (label: string, value: string, values: string[], change: (value: string) => void) => (
    <div data-map-field>
      <span>{label}</span>
      <Combobox
        aria-label={label}
        value={value || null}
        createCustomValue
        placeholder="Select returned identity or enter a variable"
        options={[...new Set([...values, ...(value ? [value] : [])])].map((item) => ({
          value: item,
          label: item,
          description: values.includes(item) ? undefined : 'Saved/custom selection; may be unavailable',
        }))}
        onChange={(option) => change(option.value)}
      />
    </div>
  );
  const editing = useSyncExternalStore(
    (notify) => locationService.getHistory().listen(notify),
    () => locationService.getSearch().get('editPanel') === String(id)
  );
  const [selected, setSelected] = useState('');
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState('');
  const selectElement = (id: string) => {
    setSelected(id);
    setMessage('');
  };
  const drag = useRef<Drag | null>(null);
  useEffect(() => {
    if (!editing) {
      drag.current = null;
    }
  }, [editing]);
  const router = diagram.routers.find((r) => r.id === selected);
  const traffic = diagram.traffic.find((t) => t.id === selected);
  const connection = diagram.connections.find((c) => c.id === selected);
  const worldWidth = Math.max(
    1040,
    ...diagram.routers.map((r) => r.x + 180),
    ...diagram.traffic.map((t) => t.x + t.width + (t.showInterfaceDetails === false ? 8 : 200))
  );
  const worldHeight = Math.max(
    660,
    ...diagram.routers.map((r) => r.y + 100),
    ...diagram.traffic.map((t) => t.y + (t.width * 70) / 120 + 80)
  );
  const save = (next: Diagram) => {
    if (!editing) {
      return;
    }
    onOptionsChange({ ...options, schemaVersion: 1, diagram: next });
    setMessage('');
  };
  const attempt = (action: () => Diagram) => {
    try {
      save(action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid operation');
    }
  };
  const updateRouter = (patch: Partial<RouterNode>) =>
    save({ ...diagram, routers: diagram.routers.map((r) => (r.id === selected ? { ...r, ...patch } : r)) });
  const updateTraffic = (patch: Partial<TrafficNode>) =>
    save({ ...diagram, traffic: diagram.traffic.map((t) => (t.id === selected ? { ...t, ...patch } : t)) });
  const updateConnection = (patch: Partial<Connection>) => {
    const next = {
      ...diagram,
      connections: diagram.connections.map((c) => (c.id === selected ? { ...c, ...patch } : c)),
    };
    attempt(() => readDiagram({ schemaVersion: 1, diagram: next }));
  };
  const begin = (event: React.PointerEvent, node: RouterNode | TrafficNode, resize = false) => {
    if (!editing || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectElement(node.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      x: node.x,
      y: node.y,
      width: 'width' in node ? node.width : 150,
      resize,
      snapshot: diagram,
    };
  };
  const move = (event: React.PointerEvent) => {
    const d = drag.current;
    if (!editing || !d) {
      return;
    }
    const dx = (event.clientX - d.startX) / zoom,
      dy = (event.clientY - d.startY) / zoom;
    const position = { x: Math.max(8, Math.round(d.x + dx)), y: Math.max(32, Math.round(d.y + dy)) };
    const next = {
      ...diagram,
      routers: diagram.routers.map((r) => (r.id === d.id ? { ...r, ...position } : r)),
      traffic: diagram.traffic.map((t) =>
        t.id === d.id
          ? { ...t, ...(d.resize ? { width: Math.max(120, Math.min(360, Math.round(d.width + dx))) } : position) }
          : t
      ),
    };
    save(next);
  };
  const end = () => {
    drag.current = null;
  };
  const text = (label: string, value: string, change: (value: string) => void) => (
    <label data-map-field>
      {label}
      <input data-map-control value={value} onChange={(e) => change(e.target.value)} />
    </label>
  );
  const routers = (label: string, value: string, change: (value: string) => void) => (
    <div data-map-field>
      <span>{label}</span>
      <Combobox
        aria-label={label}
        value={value}
        options={diagram.routers.map((r) => ({ value: r.id, label: r.name }))}
        onChange={(option) => change(option.value)}
      />
    </div>
  );

  return (
    <section
      className={styles}
      aria-label="Network Traffic Map diagram"
      style={
        {
          '--map-background': theme.isDark ? '#0c141f' : '#edf2f7',
          '--map-grid': theme.isDark ? '#31455d' : '#c3d0df',
          '--map-text': theme.isDark ? '#e5edf8' : '#18304c',
          '--map-muted': theme.isDark ? '#a4b5cb' : '#425873',
          '--map-router': theme.isDark ? '#17283c' : '#ffffff',
        } as React.CSSProperties
      }
    >
      <div className="toolbar">
        {editing && (
          <>
            <button
              data-map-control
              onClick={() => {
                const id = newId();
                save({
                  ...diagram,
                  routers: [
                    ...diagram.routers,
                    { id, name: 'New router', instance: '', x: 40 + diagram.routers.length * 20, y: 60 },
                  ],
                });
                selectElement(id);
              }}
            >
              Add router
            </button>
            <button
              data-map-control
              disabled={!diagram.routers.length}
              onClick={() => {
                const id = newId();
                save({
                  ...diagram,
                  traffic: [
                    ...diagram.traffic,
                    {
                      id,
                      routerId: router?.id ?? diagram.routers[0].id,
                      ifName: '',
                      alias: '',
                      description: '',
                      width: 120,
                      x: 280,
                      y: 140,
                    },
                  ],
                });
                selectElement(id);
              }}
            >
              Add traffic
            </button>
            <button
              data-map-control
              disabled={diagram.routers.length < 2}
              onClick={() => {
                const id = newId();
                save({
                  ...diagram,
                  connections: [
                    ...diagram.connections,
                    { id, source: diagram.routers[0].id, target: diagram.routers[1].id },
                  ],
                });
                selectElement(id);
              }}
            >
              Add connection
            </button>
            {!diagram.routers.length && (
              <button data-map-control onClick={() => save(fixtureDiagram())}>
                Load fixture layout
              </button>
            )}
          </>
        )}
        <div className="zoom-field">
          <span>Zoom</span>
          <div className="zoom-control">
            <Combobox
              aria-label="Diagram zoom"
              value={zoom}
              options={[
                { value: 0.25, label: '25%' },
                { value: 0.5, label: '50%' },
                { value: 0.75, label: '75%' },
                { value: 1, label: '100%' },
                { value: 1.25, label: '125%' },
                { value: 1.5, label: '150%' },
              ]}
              onChange={(option) => {
                end();
                setZoom(option.value);
              }}
            />
          </div>
        </div>
        <span className="muted">Traffic history and current 5-minute rates</span>
      </div>
      <div className="muted" aria-label="Data diagnostics" style={{ maxHeight: 54, overflow: 'auto', flexShrink: 0 }}>
        {`${routerIdentities.length} routers / ${channels.length} channels returned. `}
        {index.issues.join('; ') ||
          (channels.length ? 'Rates are query results in bit/s.' : 'Configure panel queries and result mappings.')}
      </div>
      <div className="layout">
        {editing && message && (
          <div
            role="alert"
            className="notice"
            style={{
              background: theme.colors.background.secondary,
              color: theme.colors.text.primary,
              borderColor: theme.colors.warning.main,
            }}
          >
            <span>{message}</span>
            <button data-map-control onClick={() => setMessage('')}>
              Dismiss
            </button>
          </div>
        )}
        <div className="viewport">
          <div style={{ width: worldWidth * zoom, height: worldHeight * zoom }}>
            <div
              className="world"
              data-testid="diagram-world"
              style={{ width: worldWidth, height: worldHeight, transform: `scale(${zoom})` }}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={() => {
                const snapshot = drag.current?.snapshot;
                end();
                if (snapshot) {
                  save(snapshot);
                }
              }}
            >
              <svg
                width={worldWidth}
                height={worldHeight}
                style={{ position: 'absolute', pointerEvents: 'none' }}
                aria-label="Router connections"
              >
                {diagram.connections.map((c) => {
                  const a = diagram.routers.find((r) => r.id === c.source)!,
                    b = diagram.routers.find((r) => r.id === c.target)!;
                  const route = routeConnection({ ...a, width: 150, height: 64 }, { ...b, width: 150, height: 64 });
                  return (
                    route && (
                      <path
                        key={c.id}
                        data-testid={`connection-${c.id}`}
                        data-from-side={route.from}
                        data-to-side={route.to}
                        d={route.d}
                        fill="none"
                        stroke={editing && selected === c.id ? '#77adff' : '#6887ab'}
                        strokeWidth={2}
                      />
                    )
                  );
                })}
              </svg>
              {!diagram.routers.length && (
                <p style={{ padding: 24, color: '#a4afbf' }}>
                  {editing
                    ? 'Empty diagram. Add routers or load the fixture layout.'
                    : 'Empty diagram. Open the panel editor to add routers.'}
                </p>
              )}
              {diagram.routers.map((r) => (
                <div
                  key={r.id}
                  data-testid={`router-${r.id}`}
                  className={`node router ${editing ? 'handle' : ''} ${editing && selected === r.id ? 'selected' : ''}`}
                  style={{ left: r.x, top: r.y }}
                  onPointerDown={(e) => begin(e, r)}
                >
                  <strong title={r.name}>{r.name}</strong>
                  <span className="muted">{r.instance || 'Instance not set'}</span>
                </div>
              ))}
              {diagram.traffic.map((t) => {
                const current = channelData(t);
                const status = current?.status ?? 'UNKNOWN';
                const color = statusColors[status];
                const showDetails = t.showInterfaceDetails !== false;
                const visible = (field: keyof NonNullable<TrafficNode['visibleFields']>) =>
                  t.visibleFields?.[field] ?? !['instance', 'routerName'].includes(field);
                return (
                  <div
                    key={t.id}
                    data-testid={`traffic-${t.id}`}
                    className={`node traffic ${editing && selected === t.id ? 'selected' : ''}`}
                    style={{ left: t.x, top: t.y }}
                  >
                    {editing && (
                      <button data-map-control className="grip handle" onPointerDown={(e) => begin(e, t)}>
                        Move {t.ifName}
                      </button>
                    )}
                    <TrafficPlot
                      key={`${t.routerId}:${t.ifName}:${current?.instance}:${timeRange.from.valueOf()}:${timeRange.to.valueOf()}:${t.width}:${zoom}:${showDetails}:${editing}`}
                      channel={current}
                      width={t.width}
                      from={timeRange.from.valueOf()}
                      to={timeRange.to.valueOf()}
                      timeZone={timeZone}
                      showDetails={showDetails}
                    />
                    {showDetails && (
                      <div className="info" data-testid="interface-details">
                        <strong>
                          {visible('channel') && (current?.channel || t.ifName || 'Select channel')}{' '}
                          <span style={{ color }}>
                            <span aria-hidden="true">&#9679;</span> {status}
                          </span>
                        </strong>
                        {visible('instance') && <div>{current?.instance || '--'}</div>}
                        {visible('routerName') && <div>{current?.routerName || '--'}</div>}
                        {visible('alias') && <div>{current?.alias || '--'}</div>}
                        {visible('description') && <div>{current?.description || '--'}</div>}
                        {visible('capacity') && <div>Capacity {formatRate(current?.capacity)}</div>}
                        <div aria-label="Channel diagnostics">
                          {current
                            ? current.issues.length
                              ? `${current.issues[0]}${current.issues.length > 1 ? ` (+${current.issues.length - 1} checks)` : ''}`
                              : 'Data available'
                            : 'Selected channel unavailable or invalid variable; no data'}
                        </div>
                      </div>
                    )}
                    {editing && selected === t.id && (
                      <button
                        data-map-control
                        aria-label="Resize traffic"
                        className="resize"
                        onPointerDown={(e) => begin(e, t, true)}
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {editing && (
          <aside aria-label="Element settings">
            <div data-map-field>
              <span>Selected element</span>
              <Combobox
                aria-label="Selected element"
                value={selected || null}
                placeholder="Select an element"
                options={[
                  ...diagram.routers.map((r) => ({ value: r.id, label: r.name })),
                  ...diagram.traffic.map((t) => ({ value: t.id, label: t.ifName || 'Unconfigured traffic' })),
                  ...diagram.connections.map((c, i) => ({ value: c.id, label: `Connection ${i + 1}` })),
                ]}
                onChange={(option) => selectElement(option.value)}
              />
            </div>
            {router && (
              <>
                {text('Router name', router.name, (name) => updateRouter({ name }))}
                {identityPicker('Router instance', router.instance, routerIdentities, (instance) =>
                  updateRouter({ instance })
                )}
              </>
            )}
            {traffic && (
              <>
                {routers('Router', traffic.routerId, (routerId) => updateTraffic({ routerId }))}
                {identityPicker(
                  'Channel',
                  traffic.ifName,
                  channels
                    .filter(
                      (channel) =>
                        channel.instance ===
                        resolve(diagram.routers.find((node) => node.id === traffic.routerId)?.instance ?? '')
                    )
                    .map((channel) => channel.channel),
                  (ifName) => updateTraffic({ ifName })
                )}
                <p className="muted">
                  Alias and description come from query results. Configure their mappings in panel options.
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={traffic.showInterfaceDetails !== false}
                    onChange={(event) => updateTraffic({ showInterfaceDetails: event.target.checked })}
                  />{' '}
                  Show interface details
                </label>
                {traffic.showInterfaceDetails !== false && (
                  <details>
                    <summary>Visible details</summary>
                    {(['instance', 'routerName', 'channel', 'alias', 'description', 'capacity'] as const).map(
                      (field) => (
                        <label key={field} style={{ display: 'block' }}>
                          <input
                            type="checkbox"
                            checked={traffic.visibleFields?.[field] ?? !['instance', 'routerName'].includes(field)}
                            onChange={(event) =>
                              updateTraffic({
                                visibleFields: { ...traffic.visibleFields, [field]: event.target.checked },
                              })
                            }
                          />{' '}
                          {field}
                        </label>
                      )
                    )}
                  </details>
                )}
                <details>
                  <summary>Data quality</summary>
                  {channelData(traffic)?.issues.map((issue) => <p key={issue}>{issue}</p>) ?? (
                    <p>Selected channel unavailable or invalid variable</p>
                  )}
                </details>
                <label data-map-field>
                  Graph width
                  <input
                    data-map-control
                    type="range"
                    min={120}
                    max={360}
                    value={traffic.width}
                    onChange={(e) => updateTraffic({ width: Number(e.target.value) })}
                  />
                </label>
                <p>
                  {traffic.width} x {Math.round((traffic.width * 70) / 120)} px graph
                </p>
              </>
            )}
            {connection && (
              <>
                {routers('From router', connection.source, (source) => updateConnection({ source }))}
                {routers('To router', connection.target, (target) => updateConnection({ target }))}
              </>
            )}
            {(router || traffic) && (
              <>
                <label data-map-field>
                  X
                  <input
                    data-map-control
                    type="number"
                    min={8}
                    value={(router ?? traffic)!.x}
                    onChange={(e) => {
                      const x = Math.max(8, Number(e.target.value));
                      if (router) {
                        updateRouter({ x });
                      } else {
                        updateTraffic({ x });
                      }
                    }}
                  />
                </label>
                <label data-map-field>
                  Y
                  <input
                    data-map-control
                    type="number"
                    min={32}
                    value={(router ?? traffic)!.y}
                    onChange={(e) => {
                      const y = Math.max(32, Number(e.target.value));
                      if (router) {
                        updateRouter({ y });
                      } else {
                        updateTraffic({ y });
                      }
                    }}
                  />
                </label>
                <button
                  data-map-control
                  onClick={() => {
                    const id = newId();
                    attempt(() => {
                      const next = duplicateElement(diagram, selected, id);
                      selectElement(id);
                      return next;
                    });
                  }}
                >
                  Duplicate element
                </button>
              </>
            )}
            {(router || traffic || connection) && (
              <button data-map-control onClick={() => attempt(() => removeElement(diagram, selected))}>
                Remove element
              </button>
            )}
            <p className="muted">
              Selections and positions are saved with the dashboard. Metric expressions belong in queries; result
              mappings are in panel options.
            </p>
          </aside>
        )}
      </div>
      {editing && (
        <div role="status" className="muted">
          Use Back to return to the dashboard, then Save to keep your changes.
        </div>
      )}
    </section>
  );
}
