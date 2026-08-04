"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/** 3D tilt-on-hover wrapper with a pointer-following glare highlight. */
export default function Tilt({
  children,
  className,
  glareClassName = "rounded-2xl",
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  glareClassName?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 220, damping: 20 });
  const sy = useSpring(y, { stiffness: 220, damping: 20 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    x.set(nx);
    y.set(ny);
    e.currentTarget.style.setProperty("--gx", `${(nx * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--gy", `${(ny * 100).toFixed(1)}%`);
  };

  const handlePointerLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div className={cn("group [perspective:1200px]", className)}>
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={
          reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative h-full will-change-transform"
      >
        {children}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            glareClassName,
          )}
          style={{
            background:
              "radial-gradient(520px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.16), transparent 55%)",
          }}
        />
      </motion.div>
    </div>
  );
}
