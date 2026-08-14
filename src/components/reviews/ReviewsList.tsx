import Reveal from "@/components/ui/Reveal";
import StarRating from "@/components/reviews/StarRating";
import type { Review } from "@/data/reviews";

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-mist">
        No reviews yet — be the first to share how it went.
      </p>
    );
  }

  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
      {reviews.map((review, i) => (
        <Reveal key={review.id} delay={i * 0.06} className="h-full">
          <div className="flex h-full flex-col gap-4 bg-night p-7">
            <div className="flex items-center gap-3">
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
              <div>
                <p className="text-sm font-medium text-snow">{review.name || "Verified traveler"}</p>
                <StarRating rating={review.rating} size="sm" />
              </div>
            </div>
            <p className="text-sm leading-relaxed text-mist">{review.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
