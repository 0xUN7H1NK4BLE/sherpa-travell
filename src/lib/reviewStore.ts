import { and, desc, eq } from "drizzle-orm";
import { db } from "./db/client";
import { reviews, type Review } from "./db/schema";

export interface NewReviewInput {
  subjectType: "trek" | "expedition";
  subjectSlug: string;
  name?: string;
  photoUrl?: string;
  rating: number;
  text: string;
}

export async function insertReview(data: NewReviewInput): Promise<Review> {
  const [row] = await db.insert(reviews).values({ ...data, approved: false }).returning();
  return row;
}

export async function listReviews(): Promise<Review[]> {
  return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

export async function listApprovedReviews(
  subjectType: "trek" | "expedition",
  subjectSlug: string,
): Promise<Review[]> {
  return db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.approved, true),
        eq(reviews.subjectType, subjectType),
        eq(reviews.subjectSlug, subjectSlug),
      ),
    )
    .orderBy(desc(reviews.createdAt));
}

export async function listFeaturedReviews(limit: number): Promise<Review[]> {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function updateReviewApproval(id: number, approved: boolean): Promise<Review | null> {
  const [row] = await db.update(reviews).set({ approved }).where(eq(reviews.id, id)).returning();
  return row ?? null;
}

export async function deleteReview(id: number): Promise<Review | null> {
  const [row] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
  return row ?? null;
}
