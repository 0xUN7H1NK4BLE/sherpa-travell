"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { treks } from "@/data/treks";

function Counter({
  to,
  duration = 1.8,
}: {
  to: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const value = useMotionValue(reduce ? to : 0);
  const rounded = useTransform(value, (v) =>
    Math.round(v).toLocaleString("en-US"),
  );

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(value, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, reduce, to, duration, value]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
    </span>
  );
}

export default function StatsBand() {
  const stats = [
    { value: 8, label: "Trekking regions" },
    { value: 5545, label: "Highest point · metres" },
    { value: 21, label: "Longest expedition · days" },
    {
      value: treks.reduce((sum, t) => sum + t.durationDays, 0),
      label: "Days of trail mapped",
    },
  ];

  return (
    <section className="border-y border-line bg-night-raised">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 px-6 py-10 md:px-10 md:py-14"
          >
            <span className="font-display text-4xl font-light text-saffron md:text-6xl">
              <Counter to={stat.value} />
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-mist">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
