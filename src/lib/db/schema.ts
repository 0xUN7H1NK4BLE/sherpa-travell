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

export const galleryScenes = pgTable("gallery_scenes", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  src: text("src").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  alt: text("alt").notNull(),
  credit: text("credit").notNull(),
});

export type GallerySceneRow = typeof galleryScenes.$inferSelect;
export type NewGallerySceneRow = typeof galleryScenes.$inferInsert;

export const galleryFilms = pgTable("gallery_films", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  src: text("src").notNull(),
  poster: text("poster"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  trekSlug: text("trek_slug"),
  trekName: text("trek_name"),
  alt: text("alt").notNull(),
  credit: text("credit").notNull(),
});

export type GalleryFilmRow = typeof galleryFilms.$inferSelect;
export type NewGalleryFilmRow = typeof galleryFilms.$inferInsert;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  subjectType: text("subject_type").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  name: text("name"),
  photoUrl: text("photo_url"),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  photo: text("photo").notNull(),
  bio: text("bio"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  whatsapp: text("whatsapp"),
});

export type TeamMemberRow = typeof teamMembers.$inferSelect;
export type NewTeamMemberRow = typeof teamMembers.$inferInsert;
