import { Sample } from '../data/model';
export const BUCKET = 300000;
export const plot = { left: 24, right: 118, top: 3, middle: 31, bottom: 59 };
export function axisLimit(samples: Sample[]): number {
  let maximum = 0;
  for (const sample of samples) {
    if (sample.value !== null && Number.isFinite(sample.value) && sample.value >= 0) {
      maximum = Math.max(maximum, sample.value);
    }
  }
  if (!maximum) {
    return 1;
  }
  const target = Number.isFinite(maximum * 1.1) ? maximum * 1.1 : maximum;
  const order = 10 ** Math.floor(Math.log10(target));
  return [1, 2, 5, 10].map((n) => n * order).find((n) => n >= target && Number.isFinite(n)) ?? maximum;
}
export function formatRate(value: number | null | undefined, compact = false): string {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return '--';
  }
  const unit = value >= 1e9 ? 3 : value >= 1e6 ? 2 : value >= 1e3 ? 1 : 0;
  const number = value / 1000 ** unit;
  const text = number === 0 ? '0' : Number(number.toPrecision(3)).toString();
  return compact ? `${text}${['b', 'k', 'M', 'G'][unit]}` : `${text} ${['bit/s', 'kbit/s', 'Mbit/s', 'Gbit/s'][unit]}`;
}
export const xFor = (time: number, from: number, to: number) =>
  plot.left + ((time - from) / Math.max(1, to - from)) * (plot.right - plot.left);
export function hoveredBucket(x: number, from: number, to: number): number | undefined {
  if (to <= from || x < plot.left || x > plot.right) {
    return undefined;
  }
  const first = Math.ceil((from + BUCKET) / BUCKET) * BUCKET;
  const last = Math.floor(to / BUCKET) * BUCKET;
  const time = from + ((x - plot.left) / (plot.right - plot.left)) * (to - from);
  const endpoint = Math.floor((x === plot.right ? time - 1 : time) / BUCKET) * BUCKET + BUCKET;
  return endpoint >= first && endpoint <= last ? endpoint : undefined;
}
export function timeText(time: number, zone: string, full = false): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(full ? ({ month: 'short', day: '2-digit', year: 'numeric' } as const) : {}),
    ...(zone && zone !== 'browser' ? { timeZone: zone === 'utc' ? 'UTC' : zone } : {}),
  };
  try {
    return new Intl.DateTimeFormat('en-GB', options).format(time);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(time);
  }
}
