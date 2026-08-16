"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import StarRating from "@/components/reviews/StarRating";
import type { Review } from "@/data/reviews";

export type CardData = { review: Review; image?: string; subjectName?: string };

function Card({
  review,
  image,
  subjectName,
  hidden,
}: CardData & { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-night sm:w-[380px]"
    >
      {image && (
        <div className="relative aspect-[4/3] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={review.photoUrl ? (review.name ?? "Reviewer photo") : `${subjectName} review`}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {!review.photoUrl && subjectName && (
            <span className="absolute bottom-3 left-3 rounded-full bg-night/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-snow backdrop-blur-sm">
              {subjectName}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-7">
        <StarRating rating={review.rating} />
        <p className="flex-1 font-display text-lg leading-snug font-light text-snow/90">
          &ldquo;{review.text}&rdquo;
        </p>
        <div className="flex items-center gap-2 border-t border-line pt-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night-raised text-xs font-medium text-mist">
            {(review.name ?? "?").trim().charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-medium text-snow">{review.name || "Verified traveler"}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsRail({ cards }: { cards: CardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const el = trackRef.current;
    if (!el) return;
    let frame: number;
    const tick = () => {
      if (!pausedRef.current && !draggingRef.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += 0.5;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
  }
  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      ref={trackRef}
      className="testimonial-marquee"
      aria-label="Traveler reviews - hover and scroll or drag to browse"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="testimonial-marquee-track gap-6 py-2">
        {cards.map((c, i) => (
          <Card key={`${c.review.id}-${i}`} {...c} />
        ))}
        {cards.map((c, i) => (
          <Card key={`${c.review.id}-dup-${i}`} {...c} hidden />
        ))}
      </div>
    </div>
  );
}
