import { axisLimit, BUCKET, formatRate, hoveredBucket, plot, timeText, xFor } from './trafficGeometry';

test('symmetric scale follows observed traffic with headroom, ignores invalid data', () => {
  expect(
    axisLimit([
      { time: 0, value: 1200000 },
      { time: 0, value: 7500000 },
      { time: 0, value: NaN },
    ])
  ).toBe(10000000);
  expect(
    axisLimit([
      { time: 0, value: 0 },
      { time: 0, value: null },
    ])
  ).toBe(1);
  expect(axisLimit([{ time: 0, value: 10000000 }])).toBe(20000000);
});
test('decimal rates preserve zero and gaps without negative outbound labels', () => {
  expect(formatRate(0)).toBe('0 bit/s');
  expect(formatRate(12345)).toBe('12.3 kbit/s');
  expect(formatRate(2500000)).toBe('2.5 Mbit/s');
  expect(formatRate(1e9)).toBe('1 Gbit/s');
  expect(formatRate(2e7, true)).toBe('20M');
  for (const value of [null, undefined, NaN, Infinity, -1]) {
    expect(formatRate(value)).toBe('--');
  }
});
test('hover selects complete UTC buckets including last pixel, independent of size', () => {
  expect(hoveredBucket(plot.left, 0, 3 * BUCKET)).toBe(BUCKET);
  expect(hoveredBucket(xFor(BUCKET + 1, 0, 3 * BUCKET), 0, 3 * BUCKET)).toBe(2 * BUCKET);
  expect(hoveredBucket(plot.right, 0, 3 * BUCKET)).toBe(3 * BUCKET);
  expect(hoveredBucket(plot.left - 1, 0, 3 * BUCKET)).toBeUndefined();
  expect(hoveredBucket(plot.left, 10000, 3 * BUCKET)).toBeUndefined();
  expect(hoveredBucket(plot.right, 0, 3 * BUCKET + 10000)).toBeUndefined();
  expect(hoveredBucket(60, 0, 10000)).toBeUndefined();
});
test('time labels respect dashboard timezone and UTC fallback', () => {
  expect(timeText(Date.UTC(2026, 8, 25, 12), 'utc')).toBe('12:00');
  expect(timeText(Date.UTC(2026, 8, 25, 12), 'America/Toronto')).toBe('08:00');
  expect(timeText(Date.UTC(2026, 8, 25, 12), 'invalid')).toBe('12:00');
});
