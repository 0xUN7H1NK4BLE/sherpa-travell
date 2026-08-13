"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Scene3DBoundary from "./Scene3DBoundary";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useThemeColor } from "./useThemeColor";

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Ridge({
  seed,
  peakHeight,
  color,
}: {
  seed: number;
  peakHeight: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const width = 40;
    const depth = 24;
    const geo = new THREE.PlaneGeometry(width, depth, 48, 24);
    geo.rotateX(-Math.PI / 2);

    const rand = seededRandom(seed);
    const position = geo.attributes.position;
    const ridgeCount = 4 + Math.floor(rand() * 3);
    const ridgeCenters = Array.from({ length: ridgeCount }, () => ({
      x: (rand() - 0.5) * width,
      z: (rand() - 0.5) * depth * 0.6,
      strength: 0.6 + rand() * 0.4,
    }));

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      let y = 0;
      for (const center of ridgeCenters) {
        const dx = x - center.x;
        const dz = z - center.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        y += Math.exp(-dist * dist * 0.01) * peakHeight * center.strength;
      }
      y += (rand() - 0.5) * 0.3;
      position.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed, peakHeight]);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function TerrainContents({
  seed,
  peakHeight,
  reduced,
  mobile,
  containerRef,
}: {
  seed: number;
  peakHeight: number;
  reduced: boolean;
  mobile: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const driftEnabled = !reduced && !mobile;

  useFrame((state) => {
    if (!driftEnabled || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.06) * 0.08;
  });

  const terrainColor = useThemeColor(containerRef, "--ink-muted", "#93a3b5");
  const accentColor = useThemeColor(containerRef, "--accent", "#f59e0b");
  const bgColor = useThemeColor(containerRef, "--bg", "#0a0e14");

  return (
    <group ref={groupRef}>
      <fog attach="fog" args={[bgColor, 20, 55]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} color={accentColor} castShadow />
      <Ridge seed={seed} peakHeight={peakHeight} color={terrainColor} />
    </group>
  );
}

export default function TerrainScene({
  seed,
  peakAltitudeM,
  fallback,
  className,
}: {
  seed: number;
  peakAltitudeM?: number;
  fallback: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639.98px)").matches,
  );
  const [contextLost, setContextLost] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639.98px)");
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const peakHeight = peakAltitudeM ? Math.min(6, 2 + peakAltitudeM / 3000) : 4;

  if (contextLost) {
    return (
      <div ref={containerRef} className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Scene3DBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 5, 18], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={(state) => {
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              setContextLost(true);
            };
            state.gl.domElement.addEventListener(
              "webglcontextlost",
              handleContextLost,
              { once: true },
            );
          }}
        >
          <Suspense fallback={null}>
            <TerrainContents
              seed={seed}
              peakHeight={peakHeight}
              reduced={reduced}
              mobile={mobile}
              containerRef={containerRef}
            />
          </Suspense>
        </Canvas>
      </Scene3DBoundary>
    </div>
  );
}
