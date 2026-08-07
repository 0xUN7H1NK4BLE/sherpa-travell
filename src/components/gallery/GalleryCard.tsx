"use client";

import { motion } from "framer-motion";
import Tilt from "@/components/ui/Tilt";
import type { GalleryItem } from "@/data/gallery";

function Media({ item }: { item: GalleryItem }) {
  if (item.type === "video") {
    return (
      <video
        src={item.src}
        poster={item.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="w-full"
      />
    );
  }
  return (
    <img
      src={item.src}
      alt={item.alt}
      loading="lazy"
      decoding="async"
      className="w-full"
    />
  );
}

export default function GalleryCard({
  item,
  index,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  onOpen: (item: GalleryItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
      className="mb-4 break-inside-avoid"
    >
      <Tilt max={7} depth={18} className="block">
        <button
          type="button"
          onClick={() => onOpen(item)}
          aria-label={`View ${item.title}`}
          className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-night-raised text-left"
        >
          <Media item={item} />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/75 via-night/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <p className="font-display text-lg leading-tight text-snow">
              {item.title}
            </p>
          </div>
        </button>
      </Tilt>
    </motion.div>
  );
}
