import {
  bigint,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * WAREHUB listings — mirrors the `warehub_listings` table used by the
 * original Neon.tech SQL driver so remote sync stays column compatible.
 */
export const warehubListings = pgTable(
  "warehub_listings",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    lotId: text("lot_id").notNull(),
    postedOn: text("posted_on").notNull(),
    title: text("title").notNull(),
    location: text("location").notNull(),
    price: text("price").notNull(),
    numericPrice: numeric("numeric_price", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    pricePerSqFt: text("price_per_sq_ft").notNull(),
    negotiable: text("negotiable").notNull().default("Negotiable"),
    category: text("category").notNull(),
    propertyTypeLabel: text("property_type_label").notNull(),
    area: text("area").notNull(),
    numericArea: numeric("numeric_area", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    ownership: text("ownership").notNull().default(""),
    possession: text("possession").notNull().default(""),
    permittedUse: text("permitted_use").notNull().default(""),
    phone: text("phone").notNull().default(""),
    description: text("description").notNull().default(""),
    highlights: jsonb("highlights")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    image: text("image").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("warehub_listings_lot_id_unique").on(table.lotId)],
);

/**
 * Uploaded site photography stored as base64 — listings point at it through
 * the `/api/image?id=N` route (e.g. `/api/image?id=3`).
 */
export const warehubImages = pgTable("warehub_images", {
  id: serial("id").primaryKey(),
  lotId: text("lot_id").notNull(),
  position: integer("position").notNull().default(0),
  mime: text("mime").notNull().default("image/jpeg"),
  dataB64: text("data_b64").notNull(),
});

export type ListingRow = typeof warehubListings.$inferSelect;
export type NewListingRow = typeof warehubListings.$inferInsert;
export type ImageRow = typeof warehubImages.$inferSelect;
