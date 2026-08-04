"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import type { Trek } from "@/data/treks";
import {
  getTrekHeightfield,
  type Heightfield,
  type MeterProj,
} from "@/lib/elevation";
import {
  TrekCinema as CinemaRig,
  pointAtRoute,
  routeAlongRoute,
} from "@/lib/trekCinema";

const heightfieldCache = new Map<string, ReturnType<typeof getTrekHeightfield>>();

type RGB = [number, number, number];

function smoothstep(a: number, b: number, x: number): number {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function mix3(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const SKY_PRESETS = {
  night: { top: [3, 5, 10], mid: [8, 15, 32], hor: [24, 37, 94], grd: [3, 5, 8] },
  twil: {
    top: [16, 31, 64],
    mid: [46, 65, 102],
    hor: [141, 116, 128],
    grd: [17, 22, 31],
  },
  day: {
    top: [20, 48, 89],
    mid: [73, 115, 158],
    hor: [169, 191, 240],
    grd: [85, 103, 244],
  },
} as const;

function skyColors(day: number): {
  top: RGB;
  mid: RGB;
  hor: RGB;
  grd: RGB;
} {
  const useTwil = day < 0.45;
  const a = useTwil ? SKY_PRESETS.night : SKY_PRESETS.twil;
  const b = useTwil ? SKY_PRESETS.twil : SKY_PRESETS.day;
  const f = useTwil ? day / 0.45 : (day - 0.45) / 0.55;
  return {
    top: mix3(a.top as RGB, b.top as RGB, f),
    mid: mix3(a.mid as RGB, b.mid as RGB, f),
    hor: mix3(a.hor as RGB, b.hor as RGB, f),
    grd: mix3(a.grd as RGB, b.grd as RGB, f),
  };
}

function altitudeColor(h: number, noise: number): RGB {
  const stops: [number, RGB][] = [
    [1800, [34, 72, 48]],
    [2400, [72, 100, 66]],
    [3000, [112, 106, 66]],
    [3600, [148, 122, 78]],
    [4200, [176, 142, 96]],
    [4800, [196, 162, 116]],
    [5200, [214, 184, 138]],
    [5600, [234, 218, 190]],
    [6100, [248, 248, 250]],
    [6800, [255, 255, 255]],
  ];
  let c0 = stops[0][1];
  let c1 = stops[0][1];
  let f = 0;
  if (h > stops[0][0]) {
    for (let i = 0; i < stops.length - 1; i++) {
      const [h0, cA] = stops[i];
      const [h1, cB] = stops[i + 1];
      if (h <= h1) {
        c0 = cA;
        c1 = cB;
        f = (h - h0) / (h1 - h0);
        break;
      }
      c0 = c1;
    }
    if (h > stops[stops.length - 1][0]) {
      c0 = stops[stops.length - 1][1];
      c1 = c0;
    }
  }
  const v = 1 + (noise - 0.5) * 0.18;
  return [
    (c0[0] + (c1[0] - c0[0]) * f) * v,
    (c0[1] + (c1[1] - c0[1]) * f) * v,
    (c0[2] + (c1[2] - c0[2]) * f) * v,
  ];
}

function radialGlowTexture(stops: [number, string][]): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildTerrainGeometry(
  hf: Heightfield,
  proj: MeterProj,
): THREE.BufferGeometry {
  const maxW = 300;
  const maxH = 300;
  const gw = Math.min(hf.nCols, maxW);
  const gh = Math.min(hf.nRows, maxH);
  const positions = new Float32Array(gw * gh * 3);
  const colors = new Float32Array(gw * gh * 3);

  for (let gy = 0; gy < gh; gy++) {
    const srcRow = Math.round((gy / (gh - 1)) * (hf.nRows - 1));
    for (let gx = 0; gx < gw; gx++) {
      const srcCol = Math.round((gx / (gw - 1)) * (hf.nCols - 1));
      const lat = hf.lats[srcRow];
      const lng = hf.lngs[srcCol];
      const elev = hf.data[srcRow * hf.nCols + srcCol];
      const x = (lng - proj.cLng) * proj.xMetersPerDeg;
      const z = (lat - proj.cLat) * 111320;
      const idx = (gy * gw + gx) * 3;
      positions[idx] = x;
      positions[idx + 1] = elev;
      positions[idx + 2] = z;
      const n = hash2(gx * 0.613, gy * 0.613);
      const [r, g, b] = altitudeColor(elev, n);
      colors[idx] = r / 255;
      colors[idx + 1] = g / 255;
      colors[idx + 2] = b / 255;
    }
  }

  const indices: number[] = [];
  for (let gy = 0; gy < gh - 1; gy++) {
    for (let gx = 0; gx < gw - 1; gx++) {
      const a = gy * gw + gx;
      const b = a + 1;
      const c = (gy + 1) * gw + gx;
      const d = c + 1;
      indices.push(a, d, b, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function sampleRoute(
  route: { positions: number[][]; cumulative: number[]; total: number },
  n: number,
): number[][] {
  const out: number[][] = [];
  const pos = route.positions;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * route.total;
    let k = 0;
    while (k < route.cumulative.length - 2 && route.cumulative[k + 1] < target) {
      k++;
    }
    const segLen = route.cumulative[k + 1] - route.cumulative[k];
    const f = segLen > 0 ? (target - route.cumulative[k]) / segLen : 0;
    const a = pos[k];
    const b = pos[k + 1];
    out.push([
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ]);
  }
  return out;
}

function buildRibbon(
  samples: number[][],
): { geometry: THREE.BufferGeometry; indexCount: number } {
  const n = samples.length;
  const width = 170;
  const positions = new Float32Array(n * 3 * 3);
  const colors = new Float32Array(n * 3 * 3);
  const edgeL: RGB = [0.14, 0.1, 0.05];
  const edgeC: RGB = [1, 0.9, 0.64];
  const edgeR: RGB = [0.14, 0.1, 0.05];

  for (let i = 0; i < n; i++) {
    const a = samples[Math.max(0, i - 1)];
    const b = samples[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[2] - a[2];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const px = -dz;
    const pz = dx;
    const cx = samples[i][0];
    const cy = samples[i][1] + 26;
    const cz = samples[i][2];
    for (let s = -1; s <= 1; s++) {
      const k = i * 9 + (s + 1) * 3;
      positions[k] = cx + px * width * s;
      positions[k + 1] = cy;
      positions[k + 2] = cz + pz * width * s;
      const col = s < 0 ? edgeL : s === 0 ? edgeC : edgeR;
      colors[k] = col[0];
      colors[k + 1] = col[1];
      colors[k + 2] = col[2];
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const k = i * 3;
    indices.push(k, k + 1, k + 3);
    indices.push(k + 1, k + 4, k + 3);
    indices.push(k + 1, k + 2, k + 4);
    indices.push(k + 2, k + 5, k + 4);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return { geometry: geo, indexCount: indices.length };
}

const LOADING_STAGES = [
  "Preparing terrain",
  "Carving the valley",
  "Laying snowpack",
  "Tracing the route",
  "Lighting the range",
];

function TerrainLoading() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % LOADING_STAGES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-night">
      <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-mist">
        {LOADING_STAGES[stage]}
      </span>
      <div className="mt-4 h-px w-40 overflow-hidden bg-line">
        <div className="h-px w-1/2 animate-[hudbar_1.4s_linear_infinite] bg-saffron" />
      </div>
      <style>{`@keyframes hudbar{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}`}</style>
    </div>
  );
}

export default function TrekCinema({
  trek,
  progress,
}: {
  trek: Trek;
  progress: MotionValue<number>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    const load = () => {
      const cached = heightfieldCache.get(trek.slug);
      if (cached) return cached;
      const p = getTrekHeightfield(trek.path);
      heightfieldCache.set(trek.slug, p);
      return p;
    };

    (async () => {
      let res: Awaited<ReturnType<typeof getTrekHeightfield>>;
      try {
        res = await load();
      } catch {
        if (!disposed) setStatus("error");
        return;
      }
      if (disposed) return;

      const { hf, proj, points } = res;

      const scene = new THREE.Scene();
      const fogColor = new THREE.Color(0x9fb3cc);
      scene.fog = new THREE.Fog(fogColor, 4000, 80000);

      const camera = new THREE.PerspectiveCamera(
        60,
        Math.max(1, el.clientWidth) / Math.max(1, el.clientHeight),
        30,
        500000,
      );

      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        if (!disposed) setStatus("error");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.className = "trek-cinema-canvas";
      el.appendChild(renderer.domElement);

      // --- sky dome (time-of-day gradient + sun glow) ---
      const skyGeo = new THREE.SphereGeometry(240000, 24, 14);
      const sunDir = new THREE.Vector3(0.4, 0.5, 0.6).normalize();
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color(0x0a0f1a) },
          uMid: { value: new THREE.Color(0x2e4166) },
          uHor: { value: new THREE.Color(0x8d7480) },
          uGrd: { value: new THREE.Color(0x11161f) },
          uSunDir: { value: sunDir.clone() },
          uSunGlow: { value: new THREE.Color(0xff7a35) },
        },
        vertexShader: `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uMid;
          uniform vec3 uHor;
          uniform vec3 uGrd;
          uniform vec3 uSunDir;
          uniform vec3 uSunGlow;
          varying vec3 vWorld;
          void main() {
            vec3 dir = normalize(vWorld - cameraPosition);
            float h = dir.y;
            vec3 c;
            if (h > 0.10) {
              c = mix(uMid, uTop, smoothstep(0.10, 0.55, h));
            } else if (h > -0.05) {
              c = mix(uHor, uMid, smoothstep(-0.05, 0.10, h));
            } else {
              c = mix(uGrd, uHor, smoothstep(-0.35, -0.05, h));
            }
            float s = clamp(dot(dir, uSunDir), 0.0, 1.0);
            c += uSunGlow * (pow(s, 3000.0) * 1.4 + pow(s, 90.0) * 0.22 + pow(s, 9.0) * 0.05);
            gl_FragColor = vec4(c, 1.0);
          }`,
      });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      sky.frustumCulled = false;
      scene.add(sky);

      // --- lighting: warm sun + cool fill + hemisphere ---
      const hemi = new THREE.HemisphereLight(0xc3dcf5, 0x272d36, 0.6);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffeddd, 0);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1536, 1536);
      sun.shadow.camera.near = 2000;
      sun.shadow.camera.far = 80000;
      sun.shadow.bias = -0.00025;
      sun.shadow.normalBias = 6;
      sun.shadow.radius = 8;
      scene.add(sun);
      scene.add(sun.target);

      const fill = new THREE.DirectionalLight(0xa9c272, 0.7);
      fill.position.set(-12000, 22000, 8000);
      scene.add(fill);

      // --- terrain ---
      const terrainGeo = buildTerrainGeometry(hf, proj);
      const shadowHalf = Math.max(11000, (terrainGeo.boundingSphere?.radius ?? 0) * 0.8);
      sun.shadow.camera.left = -shadowHalf;
      sun.shadow.camera.right = shadowHalf;
      sun.shadow.camera.top = shadowHalf;
      sun.shadow.camera.bottom = -shadowHalf;
      sun.shadow.camera.updateProjectionMatrix();

      const terrain = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.96,
          metalness: 0,
          side: THREE.DoubleSide,
        }),
      );
      terrain.receiveShadow = true;
      scene.add(terrain);

      // --- route: glow ribbon + gold core line (progressive reveal) ---
      const route = routeAlongRoute(points, hf, proj);
      const samples = sampleRoute(route, 420);

      const ribbon = new THREE.Mesh(
        buildRibbon(samples).geometry,
        new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.62,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        }),
      );
      scene.add(ribbon);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(
        samples.map((p) => new THREE.Vector3(p[0], p[1] + 26, p[2])),
      );
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: 0xffd9a0,
          transparent: true,
          opacity: 0.92,
          fog: false,
        }),
      );
      scene.add(line);

      // --- day dots (additive gold glows, revealed progressively) ---
      const dotTex = radialGlowTexture([
        [0, "rgba(255,222,160,1)"],
        [0.4, "rgba(255,196,110,0.5)"],
        [1, "rgba(255,196,110,0)"],
      ]);
      const dotMat = new THREE.SpriteMaterial({
        map: dotTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0xffc35e,
        fog: false,
      });
      const dots: THREE.Sprite[] = [];
      for (const p of route.positions) {
        const dot = new THREE.Sprite(dotMat);
        dot.position.set(p[0], p[1] + 70, p[2]);
        dot.scale.set(1500, 1500, 1);
        dot.visible = false;
        scene.add(dot);
        dots.push(dot);
      }

      // --- hiker: warm glow halo + bright core ---
      const haloTex = radialGlowTexture([
        [0, "rgba(255,238,210,1)"],
        [0.35, "rgba(255,190,120,0.55)"],
        [1, "rgba(255,160,80,0)"],
      ]);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          color: 0xffc876,
          fog: false,
        }),
      );
      halo.scale.set(3000, 3000, 1);
      scene.add(halo);

      const hikerCore = new THREE.Mesh(
        new THREE.SphereGeometry(36, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff1dd, fog: false }),
      );
      scene.add(hikerCore);

      // --- rig + camera smoothing ---
      const rig = new CinemaRig(route, hf, proj);
      const start = rig.sample(0);
      const curPos = start.pos.clone();
      const curLook = start.look.clone();
      camera.position.copy(curPos);
      camera.lookAt(curLook);

      let summitP = 0;
      let summitAlt = -Infinity;
      route.positions.forEach((p, i) => {
        if (p[1] > summitAlt) {
          summitAlt = p[1];
          summitP = i / Math.max(1, route.positions.length - 1);
        }
      });

      const timer = new THREE.Timer();

      const ro = new ResizeObserver(() => {
        if (!renderer || !el.clientWidth) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(el);

      const step = () => {
        if (disposed || !renderer) return;
        if (!document.hidden) {
          const dt = Math.min(0.05, timer.getDelta());
          const p = progress.get();
          const s = rig.sample(p);

          const k = 1 - Math.exp(-dt * 3.2);
          curPos.lerp(s.pos, k);
          curLook.lerp(s.look, k);
          camera.position.copy(curPos);
          camera.lookAt(curLook);

          const dolly = 60 - 6 * Math.exp(-Math.pow((p - summitP) * 7, 2));
          if (Math.abs(camera.fov - dolly) > 0.01) {
            camera.fov = dolly;
            camera.updateProjectionMatrix();
          }

          const up = smoothstep(0.0, 0.26, p);
          const down = 1 - smoothstep(0.72, 0.96, p);
          const env = Math.min(up, down);
          const day = 0.05 + 0.95 * env;

          const sk = skyColors(day);
          (skyMat.uniforms.uTop.value as THREE.Color).setRGB(
            sk.top[0] / 255,
            sk.top[1] / 255,
            sk.top[2] / 255,
          );
          (skyMat.uniforms.uMid.value as THREE.Color).setRGB(
            sk.mid[0] / 255,
            sk.mid[1] / 255,
            sk.mid[2] / 255,
          );
          (skyMat.uniforms.uHor.value as THREE.Color).setRGB(
            sk.hor[0] / 255,
            sk.hor[1] / 255,
            sk.hor[2] / 255,
          );
          (skyMat.uniforms.uGrd.value as THREE.Color).setRGB(
            sk.grd[0] / 255,
            sk.grd[1] / 255,
            sk.grd[2] / 255,
          );

          const elev = 0.05 + env * 0.92;
          const az = -1.0 + 2.0 * p;
          sunDir.set(
            Math.cos(az) * Math.cos(elev),
            Math.sin(elev),
            Math.sin(az) * Math.cos(elev),
          );
          (skyMat.uniforms.uSunDir.value as THREE.Vector3).copy(sunDir);
          const glow = mix3([255, 122, 53], [255, 224, 216], day);
          (skyMat.uniforms.uSunGlow.value as THREE.Color).setRGB(
            glow[0] / 255,
            glow[1] / 255,
            glow[2] / 255,
          );
          sky.position.copy(camera.position);

          const sunWarm = 1 - smoothstep(0.25, 0.7, env);
          const sunCol = mix3([255, 164, 96], [255, 242, 220], sunWarm);
          sun.color.setRGB(sunCol[0] / 255, sunCol[1] / 255, sunCol[2] / 255);
          sun.intensity = 3.0 * day;
          sun.position.copy(curLook).addScaledVector(sunDir, 30000);
          sun.target.position.copy(curLook);
          sun.target.updateMatrixWorld();

          fill.intensity = 0.5 + 0.45 * day;
          hemi.intensity = 0.45 + 0.5 * day;

          renderer.toneMappingExposure = 0.72 + 0.32 * day;

          const fog = mix3(sk.hor, sk.mid, 0.25);
          (scene.fog as THREE.Fog).color.setRGB(
            fog[0] / 255,
            fog[1] / 255,
            fog[2] / 255,
          );
          renderer.setClearColor(
            new THREE.Color(fog[0] / 255, fog[1] / 255, fog[2] / 255),
          );

          const nPts = lineGeo.getAttribute("position").count;
          line.geometry.setDrawRange(0, Math.max(2, Math.floor(nPts * p)));
          ribbon.geometry.setDrawRange(
            0,
            Math.max(3, Math.floor(ribbon.geometry.index!.count * p)),
          );

          const target = p * route.total;
          route.positions.forEach((pt, i) => {
            dots[i].visible = route.cumulative[i] <= target;
          });

          const hp = pointAtRoute(route, p);
          hikerCore.position.set(hp[0], hp[1] + 70, hp[2]);
          halo.position.set(hp[0], hp[1] + 70, hp[2]);

          renderer.render(scene, camera);
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);

      if (!disposed) setStatus("ready");

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        if (renderer) {
          renderer.dispose();
          renderer.domElement.remove();
        }
        terrain.geometry.dispose();
        sky.geometry.dispose();
        line.geometry.dispose();
        ribbon.geometry.dispose();
        dotTex.dispose();
        haloTex.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [trek, progress]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {status === "loading" && <TerrainLoading />}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night">
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-mist">
            Terrain unavailable
          </span>
        </div>
      )}
    </div>
  );
}
