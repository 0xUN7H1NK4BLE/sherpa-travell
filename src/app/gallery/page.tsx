import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import GalleryWall from "@/components/gallery/GalleryWall";
import { buildGallery } from "@/data/gallery";
import { treks } from "@/data/treks";
import { readGalleryLocal } from "@/lib/galleryStore";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Every view we came home with — peak, pass and prayer-flag from all eight Sherpa-guided treks across Nepal. Filter by trek and dive in.",
};

export default function GalleryPage() {
  const content = readGalleryLocal();
  const items = buildGallery(content);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-36 pb-12 md:px-8 md:pt-44 md:pb-16">
        <Reveal>
          <Eyebrow>Gallery · {items.length} shots</Eyebrow>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl">
            Every view we came home{" "}
            <em className="text-gradient not-italic">with.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-snow/80 md:text-lg">
            Hover a card to see where it was. Click to take it full-screen and
            walk through the wall like a rolodex of the Himalaya.
          </p>
        </Reveal>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <GalleryWall
          items={items}
          treks={treks.map((t) => ({ slug: t.slug, name: t.name }))}
        />
      </main>
    </>
  );
}