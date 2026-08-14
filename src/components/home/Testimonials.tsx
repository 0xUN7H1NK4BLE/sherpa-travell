import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import StarRating from "@/components/reviews/StarRating";
import type { Review } from "@/data/reviews";

export default function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="border-y border-line bg-night-raised">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Traveler stories"
            title="What it's actually like out there."
            className="mb-14"
          />
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={i * 0.08} className="h-full">
              <div className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-night p-7">
                <StarRating rating={review.rating} />
                <p className="flex-1 font-display text-lg leading-snug font-light text-snow/90">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-line pt-4">
                  {review.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.photoUrl}
                      alt={review.name ?? "Reviewer"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-night-raised text-sm font-medium text-mist">
                      {(review.name ?? "?").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm font-medium text-snow">{review.name || "Verified traveler"}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
