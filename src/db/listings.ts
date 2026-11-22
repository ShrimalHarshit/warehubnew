import { asc, count, eq } from "drizzle-orm";
import { db } from "./index";
import { warehubListings, type ListingRow, type NewListingRow } from "./schema";
import type { Listing } from "@/components/warehub/types";

/** A row as read from SQL — `createdAt` is metadata the UI never renders. */
export type ListingSource = Omit<ListingRow, "createdAt"> & { createdAt?: Date | string | null };

export function rowToListing(r: ListingSource): Listing {
  return {
    id: Number(r.id),
    lotId: r.lotId,
    postedOn: r.postedOn,
    title: r.title,
    location: r.location,
    price: r.price,
    numericPrice: Number(r.numericPrice) || 0,
    pricePerSqFt: r.pricePerSqFt,
    negotiable: r.negotiable || "Negotiable",
    category: r.category === "Warehouse" ? "Warehouse" : "Land",
    propertyTypeLabel: r.propertyTypeLabel,
    area: r.area,
    numericArea: Number(r.numericArea) || 0,
    ownership: r.ownership || "",
    possession: r.possession || "",
    use: r.permittedUse || "",
    phone: r.phone || "",
    description: r.description || "",
    image: r.image || "/images/site-land-1.jpg",
  };
}

/** Four real Nashik-region lots so the showcase is never empty on first run. */
export const SEED_LISTINGS: NewListingRow[] = [
  {
    id: 1763600000001,
    lotId: "WH-4495",
    postedOn: "20 Nov 2026",
    title: "Bodhale Nagar Industrial Plot",
    location: "Nashik — Bodhale Nagar, Nashik, Maharashtra",
    price: "₹10 L",
    numericPrice: "1000000",
    pricePerSqFt: "₹417",
    negotiable: "Negotiable",
    category: "Land",
    propertyTypeLabel: "Land / Plot",
    area: "2,400 sq ft",
    numericArea: "2400",
    ownership: "Freehold",
    possession: "Ready to move",
    permittedUse: "Industrial use",
    phone: "+91 98230 44950",
    description:
      "Prime industrial plot located in Bodhale Nagar, Nashik with clear title, wide road frontage, and immediate possession for warehouse or light industrial setup.",
    image: "/images/site-land-1.jpg",
  },
  {
    id: 1763600000002,
    lotId: "WH-4502",
    postedOn: "14 Nov 2026",
    title: "Ambad MIDC Warehouse Shed",
    location: "Nashik — Ambad MIDC, Phase II, Nashik, Maharashtra",
    price: "₹58.5 L",
    numericPrice: "5850000",
    pricePerSqFt: "₹900",
    negotiable: "Negotiable",
    category: "Warehouse",
    propertyTypeLabel: "Warehouse / Shed",
    area: "6,500 sq ft",
    numericArea: "6500",
    ownership: "Freehold",
    possession: "Ready to move",
    permittedUse: "Logistics & storage",
    phone: "+91 98220 45020",
    description:
      "Built warehouse shed in Ambad MIDC Phase II with 40ft clear height, four loading shutters, three-phase power, and 24x7 gated access two kilometres from the Mumbai–Agra highway.",
    image: "/images/site-warehouse-1.jpg",
  },
  {
    id: 1763600000003,
    lotId: "WH-4511",
    postedOn: "06 Nov 2026",
    title: "Ghansawangi Revenue Plot",
    location: "Ahmednagar — Ghansawangi, Ahmednagar, Maharashtra",
    price: "₹42 L",
    numericPrice: "4200000",
    pricePerSqFt: "₹350",
    negotiable: "Negotiable",
    category: "Land",
    propertyTypeLabel: "Land / Plot",
    area: "12,000 sq ft",
    numericArea: "12000",
    ownership: "Freehold",
    possession: "Immediate",
    permittedUse: "Agricultural / Industrial",
    phone: "+91 98900 45110",
    description:
      "Level revenue land with 60ft approach road, survey markers fixed, and clear non-agricultural permission pending. Suitable for a yard, storage facility or light manufacturing unit.",
    image: "/images/site-land-2.jpg",
  },
  {
    id: 1763600000004,
    lotId: "WH-4518",
    postedOn: "29 Oct 2026",
    title: "Satpur Logistics Warehouse",
    location: "Nashik — Satpur MIDC, Nashik, Maharashtra",
    price: "₹1.08 Cr",
    numericPrice: "10800000",
    pricePerSqFt: "₹1,200",
    negotiable: "Negotiable",
    category: "Warehouse",
    propertyTypeLabel: "Warehouse / Shed",
    area: "9,000 sq ft",
    numericArea: "9000",
    ownership: "Leasehold",
    possession: "Ready to move",
    permittedUse: "Cold chain & distribution",
    phone: "+91 98600 45180",
    description:
      "Satpur MIDC distribution warehouse with dock-level loading bays, sprinkler provisioning, 600 KVA power backup provision and paved truck apron for articulated vehicles.",
    image: "/images/site-warehouse-2.jpg",
  },
];

export async function getAllListings(): Promise<Listing[]> {
  const rows = await db.select().from(warehubListings).orderBy(asc(warehubListings.id));
  return rows.map(rowToListing);
}

export async function ensureSeeded(): Promise<void> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(warehubListings);
  if (Number(value) === 0) {
    await db.insert(warehubListings).values(SEED_LISTINGS).onConflictDoNothing();
  }
}

export async function listingExistsByLotId(lotId: string): Promise<boolean> {
  const rows = await db
    .select({ id: warehubListings.id })
    .from(warehubListings)
    .where(eq(warehubListings.lotId, lotId))
    .limit(1);
  return rows.length > 0;
}
