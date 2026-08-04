"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryItem } from "@/data/gallery";

function Media({ item }: { item: GalleryItem }) {
  if (item.type === "video") {
    return (
      <video
        src={item.src}
        poster={item.poster}
        controls
        playsInline
        autoPlay
        className="max-h-[70vh] w-full object-contain"
      />
    );
  }
  return (
    <img
      src={item.src}
      alt={item.alt}
      className="max-h-[70vh] w-full object-contain"
    />
  );
}

export default function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const item = index === null ? null : items[index];

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, onStep]);

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-night/95 p-4 backdrop-blur-md md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <div
            className="relative flex max-h-full w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-line-strong">
              <Media item={item} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight text-snow md:text-2xl">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-mist">
                  {item.subtitle}
                  {item.trekName ? ` · ${item.trekName}` : ""}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-snow/45">
                  {item.credit}
                </p>
              </div>
              <p className="shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-mist">
                {index! + 1} / {items.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              onStep(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-night/70 p-3 text-snow/80 transition hover:text-saffron md:left-8"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              onStep(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-night/70 p-3 text-snow/80 transition hover:text-saffron md:right-8"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full border border-line bg-night/70 p-3 text-snow/80 transition hover:text-saffron md:right-8 md:top-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
