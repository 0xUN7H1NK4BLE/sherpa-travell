import { desc, eq } from "drizzle-orm";
import { db } from "./db/client";
import { inquiries, type Inquiry } from "./db/schema";

export interface NewInquiryInput {
  name: string;
  email: string;
  trek?: string;
  dates?: string;
  groupSize?: string;
  message?: string;
}

export async function insertInquiry(data: NewInquiryInput): Promise<Inquiry> {
  const [row] = await db.insert(inquiries).values(data).returning();
  return row;
}

export async function listInquiries(): Promise<Inquiry[]> {
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export async function updateInquiryStatus(
  id: number,
  status: "new" | "contacted" | "closed",
): Promise<Inquiry | null> {
  const [row] = await db
    .update(inquiries)
    .set({ status })
    .where(eq(inquiries.id, id))
    .returning();
  return row ?? null;
}
