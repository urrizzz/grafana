import { dateTime, FieldType, LoadingState, PanelData, toDataFrame } from '@grafana/data';
import { adaptFrames, downIntervals, resolveIdentity, stateOf } from './adapter';
import { channelKey, defaultMapping } from './model';

const end = 1800000;
const labels = { instance: 'r1', ifName: 'Tunnel1', ifAlias: 'WAN', ifDescr: 'Provider tunnel', name: 'Core' };
function frame(refId: string, times: number[], values: Array<number | null>, extra = {}, field = 'Value') {
  return toDataFrame({
    refId,
    fields: [
      { name: 'Time', type: FieldType.time, values: times },
      { name: field, type: FieldType.number, values, labels: { ...labels, ...extra } },
    ],
  });
}
function data(series: PanelData['series'], state = LoadingState.Done): PanelData {
  return { series, state, timeRange: { from: dateTime(0), to: dateTime(end), raw: { from: 'now-30m', to: 'now' } } };
}
function fixtures() {
  return [
    frame('A', [300000, 600000, end], [10, 20, 30]),
    frame('B', [300000, 600000, end], [1, 2, 3]),
    frame('C', [end], [40]),
    frame('D', [end], [4]),
    frame('F', [end], [1]),
    frame('G', [end], [100]),
  ];
}
function channel(series = fixtures(), to = end) {
  return adaptFrames(data(series), undefined, 0, to).channels.get(channelKey('r1', 'Tunnel1'))!;
}

test('normalizes rates without another rate/byte conversion and converts capacity once', () => {
  const result = channel();
  expect(result.current).toEqual({ in: 40, out: 4, at: end });
  expect(result.capacity).toBe(100000000);
  expect(result.alias).toBe('WAN');
  expect(result.description).toBe('Provider tunnel');
  expect(result.history.in[0].value).toBe(10);
  expect(result.issues.join()).toContain('unverified');
});
test('same channel names on separate routers remain isolated; missing selections are absent', () => {
  const result = adaptFrames(data([...fixtures(), frame('C', [end], [999], { instance: 'r2' })]), undefined, 0, end);
  expect(result.channels.size).toBe(2);
  expect(result.channels.get(channelKey('r1', 'Tunnel1'))!.current.in).toBe(40);
  expect(result.channels.get(channelKey('missing', 'Tunnel1'))).toBeUndefined();
});
test('metadata-only table channels remain selectable with automatic text metadata', () => {
  const table = toDataFrame({
    refId: 'H',
    fields: [
      { name: 'instance', type: FieldType.string, values: ['r3'] },
      { name: 'ifName', type: FieldType.string, values: ['Port1'] },
      { name: 'ifAlias', type: FieldType.string, values: ['<script>literal</script>'] },
    ],
  });
  const result = adaptFrames(data([table]), undefined, 0, end).channels.get(channelKey('r3', 'Port1'))!;
  expect(result.status).toBe('UNKNOWN');
  expect(result.alias).toBe('<script>literal</script>');
  expect(result.current.in).toBeNull();
});
test('custom refId, numeric field and identity/metadata columns support table rows', () => {
  const table = toDataFrame({
    refId: 'Traffic',
    fields: [
      { name: 'Time', type: FieldType.time, values: [end, end] },
      { name: 'device', type: FieldType.string, values: ['a', 'b'] },
      { name: 'port', type: FieldType.string, values: ['eth0', 'eth0'] },
      { name: 'note', type: FieldType.string, values: ['Left', 'Right'] },
      { name: 'rx', type: FieldType.number, values: [123, 456] },
      { name: 'oper', type: FieldType.number, values: [1, 1] },
    ],
  });
  const result = adaptFrames(
    data([table]),
    {
      instance: 'device',
      channel: 'port',
      alias: 'note',
      roles: {
        ...defaultMapping.roles,
        inCurrent: { refId: 'Traffic', field: 'rx' },
        statusCurrent: { refId: 'Traffic', field: 'oper' },
      },
    },
    0,
    end
  );
  expect(result.channels.get(channelKey('b', 'eth0'))!.current.in).toBe(456);
  expect(result.channels.get(channelKey('a', 'eth0'))!.alias).toBe('Left');
});
test.each(['identical', 'job'])('duplicate %s series are rejected rather than summed', (kind) => {
  const result = channel([...fixtures(), frame('C', [end], [40], kind === 'job' ? { job: 'other' } : {})]);
  expect(result.ambiguous).toBe(true);
  expect(result.current.in).toBeNull();
  expect(result.history.in).toEqual([]);
});
test('different job dimensions across roles cannot silently join', () => {
  const result = channel([frame('C', [end], [40], { job: 'one' }), frame('F', [end], [1], { job: 'two' })]);
  expect(result.ambiguous).toBe(true);
});
test('non-aligned range ends require a rate at the actual end, not the last bar', () => {
  const result = channel(fixtures(), end + 12345);
  expect(result.current.in).toBeNull();
  expect(result.history.in).toHaveLength(3);
  const exact = channel([...fixtures().filter((f) => f.refId !== 'C'), frame('C', [end + 12345], [99])], end + 12345);
  expect(exact.current.in).toBe(99);
});
test('source freshness and sample count evidence are honored', () => {
  const table = toDataFrame({
    refId: 'C',
    fields: [
      { name: 'Time', type: FieldType.time, values: [end] },
      { name: 'Value', type: FieldType.number, values: [40], labels },
      { name: 'source', type: FieldType.number, values: [end - 190000] },
      { name: 'samples', type: FieldType.number, values: [3] },
    ],
  });
  const result = adaptFrames(
    data([...fixtures().filter((f) => f.refId !== 'C'), table]),
    { sourceTime: 'source', sampleCount: 'samples' },
    0,
    end
  ).channels.get(channelKey('r1', 'Tunnel1'))!;
  expect(result.current.in).toBeNull();
  expect(result.issues.join()).toContain('stale or insufficient');
});
test('stale/invalid status is UNKNOWN and current rates disappear but history remains', () => {
  const result = channel([...fixtures().filter((f) => f.refId !== 'F'), frame('F', [end - 181000], [1])]);
  expect(result.status).toBe('UNKNOWN');
  expect(result.current.in).toBeNull();
  expect(result.history.in.length).toBeGreaterThan(0);
  expect(stateOf(4)).toBe('UNKNOWN');
  expect(stateOf(99)).toBe('UNKNOWN');
  expect(stateOf(6)).toBe('DOWN');
});
test('outage intervals clip, merge and never cross gaps; recovery retains outages', () => {
  const samples = [
    { time: 0, value: 2 },
    { time: 60000, value: 2 },
    { time: 300000, value: 2 },
    { time: 330000, value: 1 },
  ];
  expect(downIntervals(samples, 10000, 340000)).toEqual([
    { from: 10000, to: 120000 },
    { from: 300000, to: 330000 },
  ]);
  expect(downIntervals([{ time: 300000, value: 2, sourceTime: 0 }], 0, 360000)).toEqual([]);
});
test('coarse/unaligned/negative samples stay gaps, not fabricated bars or zero', () => {
  const result = channel([frame('A', [300000, 600000, 610000, 1200000], [-1, null, 30, 40]), frame('F', [end], [1])]);
  expect(result.history.in.map((s) => s.value)).toEqual([null, null, 40]);
  expect(result.issues.join()).toContain('5-minute');
});
test.each([LoadingState.Loading, LoadingState.Error])(
  'query %s disables current values without losing history',
  (state) => {
    const result = adaptFrames(data(fixtures(), state), undefined, 0, end);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.channels.get(channelKey('r1', 'Tunnel1'))!.status).toBe('UNKNOWN');
    expect(result.channels.get(channelKey('r1', 'Tunnel1'))!.history.in).toHaveLength(3);
  }
);
test('multiple labelled numeric fields form independent channels', () => {
  const wide = toDataFrame({
    refId: 'A',
    fields: [
      { name: 'Time', type: FieldType.time, values: [300000] },
      { name: 'one', type: FieldType.number, labels, values: [1] },
      { name: 'two', type: FieldType.number, labels: { ...labels, ifName: 'Tunnel2' }, values: [2] },
    ],
  });
  expect(adaptFrames(data([wide]), undefined, 0, end).channels.size).toBe(2);
});
test('variables accept one scalar and reject multi-select, All and unresolved values', () => {
  expect(resolveIdentity('$router', () => '"r1"')).toBe('r1');
  expect(resolveIdentity('$router', () => '["r1","r2"]')).toBeUndefined();
  expect(resolveIdentity('$router', () => '"$__all"')).toBeUndefined();
  expect(resolveIdentity('$router', () => '$router')).toBeUndefined();
  expect(resolveIdentity('r1', () => '')).toBe('r1');
});

test('All with a custom scalar expansion and multi variables are rejected before interpolation', () => {
  const all = { name: 'router', type: 'custom' as const, current: { value: '$__all' } };
  const multi = { name: 'router', type: 'custom' as const, multi: true };
  expect(resolveIdentity('$router', () => '"r1"', [all])).toBeUndefined();
  expect(resolveIdentity('$router', () => '"r1"', [multi])).toBeUndefined();
});
test('a successful response containing query errors suppresses current values', () => {
  const response = { ...data(fixtures()), errors: [{ message: 'partial query failure' }] };
  const result = adaptFrames(response, undefined, 0, end).channels.get(channelKey('r1', 'Tunnel1'))!;
  expect(result.status).toBe('UNKNOWN');
  expect(result.current.in).toBeNull();
});
test('duplicate timestamps and missing identity are diagnosed', () => {
  expect(channel([frame('A', [300000, 300000], [1, 2])]).ambiguous).toBe(true);
  const result = adaptFrames(data([frame('A', [300000], [1], { instance: '' })]), undefined, 0, end);
  expect(result.channels.size).toBe(0);
  expect(result.issues.join()).toContain('Missing identity');
});
