// Flat-top hex grid math
// Uses cube coordinates internally, axial (q,r) for storage

export const HEX_SIZE = 36; // radius in pixels

export interface HexCoord {
  q: number; // column
  r: number; // row
}

// Convert axial (q,r) to pixel center (flat-top hexagons)
export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (1.5 * q);
  const y = HEX_SIZE * (Math.sqrt(3) * 0.5 * q + Math.sqrt(3) * r);
  return { x, y };
}

// Pixel to nearest axial hex (for click detection)
export function pixelToHex(px: number, py: number): HexCoord {
  const q = ((2 / 3) * px) / HEX_SIZE;
  const r = ((-1 / 3) * px + (Math.sqrt(3) / 3) * py) / HEX_SIZE;
  return roundHex(q, r);
}

function roundHex(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;

  return { q: rq, r: rr };
}

// Generate SVG path for a flat-top hexagon centered at (cx, cy)
export function hexPath(cx: number, cy: number, size: number = HEX_SIZE): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

// Generate a grid of hex coordinates within a radius
export function hexGrid(radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q, r });
    }
  }
  return results;
}

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}
