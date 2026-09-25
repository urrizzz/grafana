import { Diagram, InterfaceMapOptions } from '../types';

export const emptyDiagram = (): Diagram => ({ routers: [], traffic: [], connections: [] });
export const newId = () => crypto.randomUUID();

// Schema 1 originally had no diagram: preserve it as an empty, editable layout.
export function readDiagram(options: InterfaceMapOptions): Diagram {
  if (options.schemaVersion !== undefined && options.schemaVersion !== 1) {
    throw new Error('Unsupported diagram version. Open it with a compatible plugin; saved options were not changed.');
  }
  const diagram = options.diagram ?? emptyDiagram();
  if (!Array.isArray(diagram.routers) || !Array.isArray(diagram.traffic) || !Array.isArray(diagram.connections)) {
    throw new Error('Invalid diagram collections. Saved options were not changed.');
  }
  const ids = new Set<string>();
  for (const item of [...diagram.routers, ...diagram.traffic, ...diagram.connections]) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)) {
      throw new Error('Diagram IDs must be unique.');
    }
    ids.add(item.id);
  }
  const routers = new Set(diagram.routers.map((r) => r.id));
  for (const node of [...diagram.routers, ...diagram.traffic]) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || node.x < 0 || node.y < 0) {
      throw new Error('Invalid element position.');
    }
  }
  for (const router of diagram.routers) {
    if (
      (router.width !== undefined && (!Number.isFinite(router.width) || router.width < 120 || router.width > 600)) ||
      (router.height !== undefined && (!Number.isFinite(router.height) || router.height < 48 || router.height > 320))
    ) {
      throw new Error('Router size must be 120-600 by 48-320 pixels.');
    }

    if (typeof router.name !== 'string' || typeof router.instance !== 'string') {
      throw new Error('Invalid router fields.');
    }
  }
  for (const traffic of diagram.traffic) {
    if (!routers.has(traffic.routerId)) {
      throw new Error('Traffic references a missing router.');
    }
    if (!Number.isFinite(traffic.width) || traffic.width < 120 || traffic.width > 360) {
      throw new Error('Traffic width must be 120-360 pixels.');
    }
    if (traffic.showInterfaceDetails !== undefined && typeof traffic.showInterfaceDetails !== 'boolean') {
      throw new Error('Invalid interface details visibility.');
    }
    if (
      traffic.visibleFields !== undefined &&
      (!traffic.visibleFields ||
        typeof traffic.visibleFields !== 'object' ||
        Array.isArray(traffic.visibleFields) ||
        Object.values(traffic.visibleFields).some((value) => typeof value !== 'boolean'))
    ) {
      throw new Error('Invalid metadata visibility.');
    }
    if ([traffic.ifName, traffic.alias, traffic.description].some((v) => typeof v !== 'string')) {
      throw new Error('Invalid channel fields.');
    }
  }
  for (const link of diagram.connections) {
    if (!routers.has(link.source) || !routers.has(link.target) || link.source === link.target) {
      throw new Error('Connections require two different existing routers.');
    }
  }
  return diagram;
}

export function removeElement(diagram: Diagram, id: string): Diagram {
  if (
    diagram.routers.some((r) => r.id === id) &&
    (diagram.traffic.some((t) => t.routerId === id) ||
      diagram.connections.some((c) => c.source === id || c.target === id))
  ) {
    throw new Error("Remove or reassign this router's traffic and connections first.");
  }
  return {
    routers: diagram.routers.filter((r) => r.id !== id),
    traffic: diagram.traffic.filter((t) => t.id !== id),
    connections: diagram.connections.filter((c) => c.id !== id),
  };
}

export function duplicateElement(diagram: Diagram, id: string, copyId: string): Diagram {
  if ([...diagram.routers, ...diagram.traffic, ...diagram.connections].some((n) => n.id === copyId)) {
    throw new Error('Duplicate ID.');
  }
  const router = diagram.routers.find((r) => r.id === id);
  if (router) {
    return {
      ...diagram,
      routers: [
        ...diagram.routers,
        { ...router, id: copyId, name: router.name + ' copy', x: router.x + 24, y: router.y + 24 },
      ],
    };
  }
  const traffic = diagram.traffic.find((t) => t.id === id);
  if (traffic) {
    return {
      ...diagram,
      traffic: [
        ...diagram.traffic,
        {
          ...traffic,
          visibleFields: traffic.visibleFields ? { ...traffic.visibleFields } : undefined,
          id: copyId,
          x: traffic.x + 24,
          y: traffic.y + 24,
        },
      ],
    };
  }
  throw new Error('Select a router or traffic element to duplicate.');
}

export function fixtureDiagram(): Diagram {
  return {
    routers: [
      { id: 'r1', name: 'CORE-01', instance: '192.0.2.10', x: 40, y: 220 },
      { id: 'r2', name: 'BRANCH-01', instance: '192.0.2.21', x: 720, y: 80 },
    ],
    traffic: [
      {
        id: 't1',
        routerId: 'r1',
        ifName: 'Tunnel10',
        alias: 'Fixture channel',
        description: 'No live data',
        width: 120,
        x: 320,
        y: 160,
      },
    ],
    connections: [{ id: 'c1', source: 'r1', target: 'r2' }],
  };
}
