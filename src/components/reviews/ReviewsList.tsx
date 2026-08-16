import Reveal from "@/components/ui/Reveal";
import StarRating from "@/components/reviews/StarRating";
import type { Review } from "@/data/reviews";

export default function ReviewsList({
  reviews,
  subjectName,
  subjectImage,
}: {
  reviews: Review[];
  subjectName: string;
  subjectImage: string;
}) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-mist">
        No reviews yet - be the first to share how it went.
      </p>
    );
  }

  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review, i) => (
        <Reveal key={review.id} delay={i * 0.06} className="h-full">
          <div className="flex h-full flex-col bg-night">
            <div className="relative aspect-[4/3] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.photoUrl || subjectImage}
                alt={review.photoUrl ? (review.name ?? "Reviewer photo") : `${subjectName} review`}
                className="h-full w-full object-cover"
              />
              {!review.photoUrl && (
                <span className="absolute bottom-3 left-3 rounded-full bg-night/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-snow backdrop-blur-sm">
                  {subjectName}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
              <StarRating rating={review.rating} size="sm" />
              <p className="flex-1 text-sm leading-relaxed text-mist">{review.text}</p>
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night-raised text-xs font-medium text-mist">
                  {(review.name ?? "?").trim().charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-snow">{review.name || "Verified traveler"}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
