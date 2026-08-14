import { unstable_cache } from "next/cache";
import { listApprovedReviews, listFeaturedReviews } from "@/lib/reviewStore";
import type { Review } from "@/lib/db/schema";

export type { Review };

const getApprovedReviewsCached = unstable_cache(
  (subjectType: "trek" | "expedition", subjectSlug: string) =>
    listApprovedReviews(subjectType, subjectSlug),
  ["reviews-by-subject"],
  { tags: ["reviews"] },
);

export async function getApprovedReviews(
  subjectType: "trek" | "expedition",
  subjectSlug: string,
): Promise<Review[]> {
  return getApprovedReviewsCached(subjectType, subjectSlug);
}

const getFeaturedReviewsCached = unstable_cache(() => listFeaturedReviews(6), ["reviews-featured"], {
  tags: ["reviews"],
});

export async function getFeaturedReviews(): Promise<Review[]> {
  return getFeaturedReviewsCached();
}
