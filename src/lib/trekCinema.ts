import * as THREE from "three";
import type { Heightfield, MeterProj } from "@/lib/elevation";
import { heightAt, toLatLng, toMeters } from "@/lib/elevation";

const RAD = Math.PI / 180;

function bearingRad(a: [number, number], b: [number, number]): number {
  const lat1 = a[0] * RAD;
  const lat2 = b[0] * RAD;
  const dlng = (b[1] - a[1]) * RAD;
  const x = Math.sin(dlng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
  return Math.atan2(x, y);
}

function distMeters(a: [number, number], b: [number, number]): number {
  const dx = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * RAD) * 111320;
  const dy = (b[0] - a[0]) * 111320;
  return Math.sqrt(dx * dx + dy * dy);
}

interface Keyframe {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

function cameraKeyframe(
  point: [number, number],
  prev: [number, number],
  next: [number, number],
  hf: Heightfield,
  proj: MeterProj,
  opts: { dist?: number; pitch?: number; tup?: number },
): Keyframe {
  const [x, z] = toMeters(point, proj);
  const alt = heightAt(hf, point[0], point[1]);
  const head = bearingRad(prev, next);
  const segLen = distMeters(prev, next);
  const dist = opts.dist ?? Math.max(5000, Math.min(9000, segLen * 2.0));
  const pitchRad = (opts.pitch ?? 50) * RAD;
  const tup = opts.tup ?? 250;

  const camX = x + Math.sin(head) * dist;
  const camZ = z - Math.cos(head) * dist;
  let camY = alt + tup + dist * Math.tan(pitchRad);

  const [camLat, camLng] = toLatLng(camX, camZ, proj);
  const camTer = heightAt(hf, camLat, camLng);
  camY = Math.max(camY, camTer + 90);

  return {
    pos: new THREE.Vector3(camX, camY, camZ),
    look: new THREE.Vector3(x, alt + 26, z),
  };
}

export interface RouteData {
  positions: number[][];
  cumulative: number[];
  total: number;
}

function pointAt(
  positions: number[][],
  cumulative: number[],
  total: number,
  p01: number,
): THREE.Vector3 {
  const target = THREE.MathUtils.clamp(p01, 0, 1) * total;
  let i = 0;
  while (i < cumulative.length - 2 && cumulative[i + 1] < target) {
    i++;
  }
  const segLen = cumulative[i + 1] - cumulative[i];
  const f = segLen > 0 ? (target - cumulative[i]) / segLen : 0;
  const a = positions[i];
  const b = positions[i + 1];
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  );
}

export class TrekCinema {
  private offsetCurve: THREE.CatmullRomCurve3;
  private cd: Float32Array;
  private positions: number[][];
  private cumulative: number[];
  private total: number;
  readonly pointCount: number;

  constructor(
    route: RouteData,
    hf: Heightfield,
    proj: MeterProj,
  ) {
    this.positions = route.positions;
    this.cumulative = route.cumulative;
    this.total = route.total;
    this.pointCount = route.positions.length;

    const n = route.positions.length;
    const pts: [number, number][] = route.positions.map((p) => [
      proj.cLat + (p[2] - 0) / 111320,
      proj.cLng + (p[0] - 0) / proj.xMetersPerDeg,
    ]);

    const kf: Keyframe[] = pts.map((p, i) =>
      cameraKeyframe(
        p,
        pts[Math.max(0, i - 1)],
        pts[Math.min(n - 1, i + 1)],
        hf,
        proj,
        {},
      ),
    );

    const rp = (i: number) =>
      new THREE.Vector3(route.positions[i][0], route.positions[i][1], route.positions[i][2]);

    const intro = cameraKeyframe(pts[0], pts[0], pts[1], hf, proj, {
      dist: 12000,
      pitch: 62,
      tup: 800,
    });
    intro.pos.y = Math.max(intro.pos.y, rp(0).y + 600);

    const outro = cameraKeyframe(
      pts[n - 1],
      pts[n - 2],
      pts[n - 1],
      hf,
      proj,
      { dist: 10000, pitch: 60, tup: 700 },
    );
    outro.pos.y = Math.max(outro.pos.y, rp(n - 1).y + 500);

    const offsetPts: THREE.Vector3[] = [];
    offsetPts.push(intro.pos.clone().sub(rp(0)));
    for (let i = 0; i < n; i++) {
      offsetPts.push(kf[i].pos.clone().sub(rp(i)));
    }
    offsetPts.push(outro.pos.clone().sub(rp(n - 1)));

    this.offsetCurve = new THREE.CatmullRomCurve3(
      offsetPts,
      false,
      "centripetal",
      0.6,
    );

    const cd = new Float32Array(n + 2);
    const total = this.total;
    cd[0] = -0.05 * total;
    for (let i = 0; i < n; i++) cd[i + 1] = this.cumulative[i];
    cd[n + 1] = total + 0.05 * total;
    this.cd = cd;
  }

  sample(p01: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const p = THREE.MathUtils.clamp(p01, 0, 1);
    const routePt = pointAt(this.positions, this.cumulative, this.total, p);
    const d = p * this.total;
    const cd = this.cd;
    let i = 0;
    while (i < cd.length - 2 && cd[i + 1] < d) i++;
    const segLen = cd[i + 1] - cd[i];
    const frac = segLen > 0 ? (d - cd[i]) / segLen : 0;
    const t = (i + frac) / (cd.length - 1);
    const off = this.offsetCurve.getPoint(t);
    const pos = routePt.clone().add(off);
    const look = new THREE.Vector3(routePt.x, routePt.y + 26, routePt.z);
    return { pos, look };
  }
}

export function routeAlongRoute(
  points: [number, number][],
  hf: Heightfield,
  proj: MeterProj,
): RouteData {
  const positions: number[][] = points.map((p) => {
    const [x, z] = toMeters(p, proj);
    const alt = heightAt(hf, p[0], p[1]);
    return [x, alt, z];
  });
  const cumulative = [0];
  for (let i = 1; i < positions.length; i++) {
    const a = positions[i - 1];
    const b = positions[i];
    const d = Math.hypot(b[0] - a[0], b[2] - a[2]);
    cumulative.push(cumulative[i - 1] + d);
  }
  const total = cumulative[cumulative.length - 1] || 1;
  return { positions, cumulative, total };
}

export function pointAtRoute(
  route: RouteData,
  p01: number,
): [number, number, number] {
  const v = pointAt(route.positions, route.cumulative, route.total, p01);
  return [v.x, v.y, v.z];
}
