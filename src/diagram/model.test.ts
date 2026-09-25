import { duplicateElement, emptyDiagram, fixtureDiagram, readDiagram, removeElement } from './model';
import { routeConnection } from './routing';

test('legacy options migrate to empty layout without changing input', () => {
  const options = { schemaVersion: 1 };
  expect(readDiagram(options)).toEqual(emptyDiagram());
  expect(options).toEqual({ schemaVersion: 1 });
  expect(() => readDiagram({ schemaVersion: 2 })).toThrow('Unsupported');
});
test('reject malformed identities and references without silently dropping data', () => {
  const d = fixtureDiagram();
  expect(() => readDiagram({ schemaVersion: 1, diagram: { ...d, routers: [d.routers[0], d.routers[0]] } })).toThrow(
    'unique'
  );
  expect(() => readDiagram({ schemaVersion: 1, diagram: { ...d, routers: [] } })).toThrow('missing');
  expect(() => readDiagram({ schemaVersion: 1, diagram: { ...d, traffic: [{ ...d.traffic[0], x: NaN }] } })).toThrow(
    'position'
  );
});
test('router removal blocks dependent data; removing links and traffic makes it safe', () => {
  const d = fixtureDiagram();
  expect(() => removeElement(d, 'r1')).toThrow('first');
  const result = removeElement(removeElement(removeElement(d, 'c1'), 't1'), 'r1');
  expect(result.routers.map((r) => r.id)).toEqual(['r2']);
  expect(d.routers).toHaveLength(2);
});
test('duplication preserves selections with independent geometry and no copied connections', () => {
  const d = fixtureDiagram();
  const result = duplicateElement(d, 't1', 'copy');
  expect(result.traffic[1].routerId).toBe('r1');
  result.traffic[1].x = 900;
  expect(d.traffic[0].x).toBe(320);
  expect(duplicateElement(d, 'r1', 'r3').connections).toEqual(d.connections);
  expect(() => duplicateElement(d, 'r1', 'r2')).toThrow('Duplicate');
});
test.each([
  [400, 0, 'right', 'left'],
  [-400, 0, 'left', 'right'],
  [0, 200, 'bottom', 'top'],
  [0, -200, 'top', 'bottom'],
  [400, 200, 'right', 'left'],
])('route %s,%s faces box edges', (x, y, from, to) => {
  const a = { x: 500, y: 300, width: 150, height: 64 };
  const route = routeConnection(a, { ...a, x: a.x + Number(x), y: a.y + Number(y) });
  expect(route).toMatchObject({ from, to });
});
test('overlapping boxes suppress their connection until separated', () => {
  const box = { x: 100, y: 100, width: 150, height: 64 };
  expect(routeConnection(box, box)).toBeNull();
  expect(routeConnection(box, { ...box, x: 400 })).not.toBeNull();
});

test('details settings are optional, validated and independently duplicated', () => {
  const d = fixtureDiagram();
  expect(readDiagram({ schemaVersion: 1, diagram: d }).traffic[0].showInterfaceDetails).toBeUndefined();
  d.traffic[0].showInterfaceDetails = false;
  d.traffic[0].visibleFields = { alias: false };
  const copy = duplicateElement(d, 't1', 'copy');
  copy.traffic[1].visibleFields!.alias = true;
  expect(d.traffic[0].visibleFields.alias).toBe(false);
  expect(copy.traffic[1].showInterfaceDetails).toBe(false);
  expect(() =>
    readDiagram({
      schemaVersion: 1,
      diagram: { ...d, traffic: [{ ...d.traffic[0], showInterfaceDetails: 'no' as unknown as boolean }] },
    })
  ).toThrow();
});
