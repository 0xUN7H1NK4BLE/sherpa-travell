import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function connectionString(): string {
  const url =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error(
      "No Postgres connection string found (checked POSTGRES_URL, DATABASE_URL, DATABASE_URL_UNPOOLED). " +
        "Run `vercel env pull .env.local` after provisioning the database.",
    );
  }
  return url;
}

const client = postgres(connectionString(), { max: 1 });

export const db = drizzle(client, { schema });
