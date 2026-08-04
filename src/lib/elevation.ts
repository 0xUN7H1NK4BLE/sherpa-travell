export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface Heightfield {
  nCols: number;
  nRows: number;
  lats: Float32Array;
  lngs: Float32Array;
  data: Float32Array;
}

export interface MeterProj {
  cLat: number;
  cLng: number;
  xMetersPerDeg: number;
}

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111320;

export function corridorPoints(
  path: [number, number][],
  minGapKm = 60,
): [number, number][] {
  const distKm = (a: [number, number], b: [number, number]) => {
    const dLat = (b[0] - a[0]) * RAD;
    const dLng = (b[1] - a[1]) * RAD;
    const la = a[0] * RAD;
    const lb = b[0] * RAD;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const pts = path.slice();
  while (pts.length > 2 && distKm(pts[0], pts[1]) > minGapKm) pts.shift();
  while (
    pts.length > 2 &&
    distKm(pts[pts.length - 2], pts[pts.length - 1]) > minGapKm
  ) {
    pts.pop();
  }
  return pts;
}

export function boxOf(points: [number, number][], padDeg = 0.06): GeoBox {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  return {
    minLat: minLat - padDeg,
    maxLat: maxLat + padDeg,
    minLng: minLng - padDeg,
    maxLng: maxLng + padDeg,
  };
}

export function meterProjFor(box: GeoBox): MeterProj {
  const cLat = (box.minLat + box.maxLat) / 2;
  return {
    cLat,
    cLng: (box.minLng + box.maxLng) / 2,
    xMetersPerDeg: METERS_PER_DEG_LAT * Math.cos(cLat * RAD),
  };
}

export function toMeters(
  [lat, lng]: [number, number],
  proj: MeterProj,
): [number, number] {
  return [
    (lng - proj.cLng) * proj.xMetersPerDeg,
    (lat - proj.cLat) * METERS_PER_DEG_LAT,
  ];
}

export function toLatLng(x: number, y: number, proj: MeterProj): [number, number] {
  return [
    y / METERS_PER_DEG_LAT + proj.cLat,
    x / proj.xMetersPerDeg + proj.cLng,
  ];
}

function mercTileXY(lat: number, lng: number, z: number): [number, number] {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = lat * RAD;
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n,
  );
  return [x, y];
}

function chooseZoom(box: GeoBox, maxTiles = 20): number {
  for (let z = 13; z >= 8; z--) {
    const n = 2 ** z;
    const degPerTile = 360 / n;
    const tilesX = Math.max(1, Math.ceil((box.maxLng - box.minLng) / degPerTile));
    const shrink = 1 / Math.cos((box.minLat * RAD + box.maxLat * RAD) / 2);
    const tilesY = Math.max(
      1,
      Math.ceil(((box.maxLat - box.minLat) * shrink) / degPerTile),
    );
    if (tilesX * tilesY <= maxTiles) return z;
  }
  return 8;
}

async function decodeImageData(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DEM ${res.status} ${url}`);
  const blob = await res.blob();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  const bmp = await createImageBitmap(blob);
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function buildHeightfield(
  box: GeoBox,
  z = chooseZoom(box),
): Promise<Heightfield> {
  const [x0, y0] = mercTileXY(box.maxLat, box.minLng, z);
  const [x1, y1] = mercTileXY(box.minLat, box.maxLng, z);
  const cols = x1 - x0 + 1;
  const rows = y1 - y0 + 1;
  const tileW = 256;
  const tileH = 256;
  const data = new Float32Array(cols * tileW * rows * tileH);

  const jobs: { url: string; dx: number; dy: number }[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      jobs.push({
        url: `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${tx}/${ty}.png`,
        dx: (tx - x0) * tileW,
        dy: (ty - y0) * tileH,
      });
    }
  }

  await Promise.all(
    jobs.map(async ({ url, dx, dy }) => {
      const img = await decodeImageData(url);
      const px = img.data;
      const gw = cols * tileW;
      for (let row = 0; row < tileH; row++) {
        const gy = dy + row;
        const baseY = gy * gw;
        const base = row * tileW * 4;
        for (let col = 0; col < tileW; col++) {
          const p = base + col * 4;
          const h = (px[p] * 256 + px[p + 1] + px[p + 2] / 256) - 32768;
          data[baseY + dx + col] = h >= 0 ? h : 0;
        }
      }
    }),
  );

  const nCols = cols * tileW;
  const nRows = rows * tileH;
  const lngs = new Float32Array(nCols);
  const lats = new Float32Array(nRows);
  const n = 2 ** z;
  const degPerTile = 360 / n;
  for (let c = 0; c < nCols; c++) {
    lngs[c] = (x0 + c / tileW) * degPerTile - 180;
  }
  for (let r = 0; r < nRows; r++) {
    const mercY = (y0 * tileH + r) / (n * tileH);
    lats[r] = Math.atan(Math.sinh(Math.PI * (1 - 2 * mercY))) * DEG;
  }

  return { nCols, nRows, lats, lngs, data };
}

export function heightAt(hf: Heightfield, lat: number, lng: number): number {
  const { nCols, nRows, lats, lngs, data } = hf;
  if (lat >= lats[0] || lat <= lats[nRows - 1]) {
    const row = clampRow(lats, lat);
    const col = clampCol(lngs, lng);
    return data[row * nCols + col];
  }
  const row = clampRow(lats, lat);
  const col = clampCol(lngs, lng);
  const y = (row - 1 + (lats[row - 1] - lat) / (lats[row - 1] - lats[row]));
  const x = (col - 1 + (lngs[col - 1] - lng) / (lngs[col - 1] - lngs[col]));
  const iy = Math.max(0, Math.min(nRows - 1, Math.floor(y)));
  const ix = Math.max(0, Math.min(nCols - 1, Math.floor(x)));
  const fy = Math.max(0, Math.min(1, y - iy));
  const fx = Math.max(0, Math.min(1, x - ix));
  const a = data[iy * nCols + ix];
  const b = data[iy * nCols + Math.min(nCols - 1, ix + 1)];
  const c = data[Math.min(nRows - 1, iy + 1) * nCols + ix];
  const d =
    data[Math.min(nRows - 1, iy + 1) * nCols + Math.min(nCols - 1, ix + 1)];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function clampRow(lats: Float32Array, lat: number): number {
  if (lat >= lats[0]) return 0;
  if (lat <= lats[lats.length - 1]) return lats.length - 1;
  let lo = 0;
  let hi = lats.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lats[mid] > lat) lo = mid;
    else hi = mid;
  }
  return lats[lo] - lat < lat - lats[hi] ? lo : hi;
}

function clampCol(lngs: Float32Array, lng: number): number {
  if (lng <= lngs[0]) return 0;
  if (lng >= lngs[lngs.length - 1]) return lngs.length - 1;
  let lo = 0;
  let hi = lngs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lngs[mid] < lng) lo = mid;
    else hi = mid;
  }
  return lngs[lo] - lng < lng - lngs[hi] ? lo : hi;
}

export async function getTrekHeightfield(
  path: [number, number][],
): Promise<{ hf: Heightfield; proj: MeterProj; box: GeoBox; points: [number, number][] }> {
  const points = corridorPoints(path);
  const box = boxOf(points);
  const proj = meterProjFor(box);
  const z = chooseZoom(box);
  const hf = await buildHeightfield(box, z);
  return { hf, proj, box, points };
}
