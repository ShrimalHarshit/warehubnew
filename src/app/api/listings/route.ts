import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { warehubListings } from "@/db/schema";
import { ensureSeeded, getAllListings, listingExistsByLotId, rowToListing } from "@/db/listings";
import { generateNextLotId } from "@/components/warehub/utils";
import type { Listing } from "@/components/warehub/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const listings = await getAllListings();
    return NextResponse.json({ listings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read listings";
    return NextResponse.json({ listings: [], error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = (body?.listing ?? body) as Partial<Listing> & { highlights?: string[] };
    const title = String(input.title || "").trim();
    const location = String(input.location || "").trim();
    const phone = String(input.phone || "").trim();
    const image = String(input.image || "/images/site-land-1.jpg");

    if (!title || !location || !phone) {
      return NextResponse.json(
        { error: "title, location and phone are required" },
        { status: 400 },
      );
    }

    const existing = await getAllListings();
    let lotId = String(input.lotId || "").trim().toUpperCase();
    if (!lotId || (await listingExistsByLotId(lotId))) {
      lotId = generateNextLotId(existing);
    }

    const category = input.category === "Warehouse" ? "Warehouse" : "Land";
    const id = Number(input.id) > 0 ? Number(input.id) : Date.now();

    const inserted = await db
      .insert(warehubListings)
      .values({
        id,
        lotId,
        postedOn: input.postedOn || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        title,
        location,
        price: input.price || "₹0",
        numericPrice: String(input.numericPrice ?? 0),
        pricePerSqFt: input.pricePerSqFt || "₹0",
        negotiable: input.negotiable || "Negotiable",
        category,
        propertyTypeLabel:
          input.propertyTypeLabel || (category === "Land" ? "Land / Plot" : "Warehouse / Shed"),
        area: input.area || "0 sq ft",
        numericArea: String(input.numericArea ?? 0),
        ownership: input.ownership || "",
        possession: input.possession || "",
        permittedUse: input.use || "",
        phone,
        description: input.description || "",
        highlights: Array.isArray(input.highlights) ? input.highlights.slice(0, 8) : [],
        image,
      })
      .returning();

    return NextResponse.json({ listing: rowToListing(inserted[0]) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const input = (body?.listing ?? body) as Partial<Listing> & { highlights?: string[] };
    const id = Number(input.id);
    if (!id || !Number.isFinite(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (input.title != null) updates.title = String(input.title).trim();
    if (input.location != null) updates.location = String(input.location).trim();
    if (input.price != null) updates.price = String(input.price).trim();
    if (input.numericPrice != null) updates.numericPrice = String(input.numericPrice);
    if (input.pricePerSqFt != null) updates.pricePerSqFt = String(input.pricePerSqFt);
    if (input.negotiable != null) updates.negotiable = String(input.negotiable);
    if (input.area != null) updates.area = String(input.area).trim();
    if (input.numericArea != null) updates.numericArea = String(input.numericArea);
    if (input.phone != null) updates.phone = String(input.phone).trim();
    if (input.description != null) updates.description = String(input.description).trim();
    if (input.image != null) updates.image = String(input.image).trim();
    if (input.ownership != null) updates.ownership = String(input.ownership).trim();
    if (input.possession != null) updates.possession = String(input.possession).trim();
    if (input.use != null) updates.permittedUse = String(input.use).trim();
    if (input.category != null) {
      const cat = input.category === "Warehouse" ? "Warehouse" : "Land";
      updates.category = cat;
      updates.propertyTypeLabel = cat === "Land" ? "Land / Plot" : "Warehouse / Shed";
    }
    if (Array.isArray(input.highlights)) updates.highlights = input.highlights.slice(0, 8);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await db
      .update(warehubListings)
      .set(updates)
      .where(eq(warehubListings.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing: rowToListing(updated[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");
    const rawLotId = searchParams.get("lotId");
    if (!rawId && !rawLotId) {
      return NextResponse.json({ error: "id or lotId is required" }, { status: 400 });
    }
    if (rawId) {
      await db.delete(warehubListings).where(eq(warehubListings.id, Number(rawId)));
    } else if (rawLotId) {
      await db.delete(warehubListings).where(eq(warehubListings.lotId, rawLotId));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
