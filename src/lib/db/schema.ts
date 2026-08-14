import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  trek: text("trek"),
  dates: text("dates"),
  groupSize: text("group_size"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;

export const treks = pgTable("treks", {
  slug: text("slug").primaryKey(),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  durationDays: integer("duration_days").notNull(),
  maxAltitudeM: doublePrecision("max_altitude_m").notNull(),
  difficulty: text("difficulty").notNull(),
  bestSeason: jsonb("best_season").notNull(),
  groupSize: text("group_size").notNull(),
  summary: text("summary").notNull(),
  highlights: jsonb("highlights").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  path: jsonb("path").notNull(),
  image: text("image").notNull(),
  gallery: jsonb("gallery").notNull(),
  tags: jsonb("tags").notNull(),
});

export type TrekRow = typeof treks.$inferSelect;
export type NewTrekRow = typeof treks.$inferInsert;

export const expeditions = pgTable("expeditions", {
  slug: text("slug").primaryKey(),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  durationDays: integer("duration_days").notNull(),
  maxAltitudeM: doublePrecision("max_altitude_m").notNull(),
  peakHeightM: doublePrecision("peak_height_m").notNull(),
  climbingGrade: text("climbing_grade").notNull(),
  permitCostUSD: doublePrecision("permit_cost_usd").notNull(),
  technicalGearRequired: boolean("technical_gear_required").notNull(),
  summitSuccessNotes: text("summit_success_notes").notNull(),
  difficulty: text("difficulty").notNull(),
  bestSeason: jsonb("best_season").notNull(),
  groupSize: text("group_size").notNull(),
  summary: text("summary").notNull(),
  highlights: jsonb("highlights").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  path: jsonb("path").notNull(),
  image: text("image").notNull(),
  gallery: jsonb("gallery").notNull(),
  tags: jsonb("tags").notNull(),
});

export type ExpeditionRow = typeof expeditions.$inferSelect;
export type NewExpeditionRow = typeof expeditions.$inferInsert;
