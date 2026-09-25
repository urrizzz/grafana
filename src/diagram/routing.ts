export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function routeConnection(a: Box, b: Box) {
  const dx = b.x + b.width / 2 - a.x - a.width / 2;
  const dy = b.y + b.height / 2 - a.y - a.height / 2;
  const gapX = Math.abs(dx) - (a.width + b.width) / 2;
  const gapY = Math.abs(dy) - (a.height + b.height) / 2;
  if (gapX <= 0 && gapY <= 0) {
    return null;
  }
  if (gapX >= gapY) {
    const right = dx > 0,
      x1 = a.x + (right ? a.width : 0),
      x2 = b.x + (right ? 0 : b.width);
    const y1 = a.y + a.height / 2,
      y2 = b.y + b.height / 2,
      middle = (x1 + x2) / 2;
    return { from: right ? 'right' : 'left', to: right ? 'left' : 'right', d: `M${x1},${y1} H${middle} V${y2} H${x2}` };
  }
  const below = dy > 0,
    y1 = a.y + (below ? a.height : 0),
    y2 = b.y + (below ? 0 : b.height);
  const x1 = a.x + a.width / 2,
    x2 = b.x + b.width / 2,
    middle = (y1 + y2) / 2;
  return { from: below ? 'bottom' : 'top', to: below ? 'top' : 'bottom', d: `M${x1},${y1} V${middle} H${x2} V${y2}` };
}
