import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import TestimonialsRail from "@/components/home/TestimonialsRail";
import { getTreks } from "@/data/treks";
import { getExpeditions } from "@/data/expeditions";
import type { Review } from "@/data/reviews";

export default async function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const [treks, expeditions] = await Promise.all([getTreks(), getExpeditions()]);
  const subjects = new Map<string, { name: string; image: string }>();
  for (const t of treks) subjects.set(`trek:${t.slug}`, { name: t.name, image: t.image });
  for (const e of expeditions) subjects.set(`expedition:${e.slug}`, { name: e.name, image: e.image });

  const cards = reviews.map((review) => {
    const subject = subjects.get(`${review.subjectType}:${review.subjectSlug}`);
    return { review, image: review.photoUrl || subject?.image, subjectName: subject?.name };
  });

  return (
    <section className="snap-page flex min-h-dvh flex-col justify-center border-y border-line bg-night-raised py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Traveler stories"
            title="What it's actually like out there."
            className="mb-14"
          />
        </Reveal>
      </div>
      <Reveal>
        <TestimonialsRail cards={cards} />
      </Reveal>
    </section>
  );
}
