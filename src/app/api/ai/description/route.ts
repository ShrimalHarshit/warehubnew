import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  category?: string;
  title?: string;
  location?: string;
  area?: string;
  deal?: string;
  tone?: string;
  photoCount?: number;
  images?: Array<{ mimeType: string; data: string }>;
};

const LAND_CHIPS = [
  "Clear & Marketable Title",
  "Wide Tar Road Frontage",
  "Water & Power Connection",
  "Fenced & Demarcated",
  "Immediate Possession",
];

const WAREHOUSE_CHIPS = [
  "28ft+ Center Height",
  "Heavy Dock Access",
  "3-Phase Industrial Power",
  "VDF Trimix Flooring",
  "Fire NOC Compliant",
];

function chipsFor(category: string) {
  return category === "Warehouse" ? WAREHOUSE_CHIPS : LAND_CHIPS;
}

/** Deterministic offline draft — never repeats price, area or the street address. */
function draftFor(category: string, location: string) {
  const corridor = location && location.trim().length > 2 ? location.trim() : "the Nashik corridor";
  if (category === "Warehouse") {
    return `Ready-to-operate storage facility off ${corridor}, with a wide turning radius for articulated vehicles and uninterrupted power for seamless logistics operations.`;
  }
  return `Well-demarcated parcel along ${corridor} offering level terrain, smooth road connectivity and clean documentation — ideal for immediate commercial development or long-term capital growth.`;
}

const TONES = ["Practical & Crisp", "Investor & Commercial", "Direct Owner Pitch"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const category = body.category === "Warehouse" ? "Warehouse" : "Land Plot";
  const location = String(body.location || "").trim();
  const tone = String(body.tone || TONES[0]);

  const prompt = `You are a commercial real estate copywriter. Write a concise, high-converting 2-sentence listing description (max 42 words) for a ${category}.
Context provided by seller (DO NOT mechanically repeat the exact price, exact area number, or full street address because those are already displayed as separate fields in the UI):
- Asset Type: ${category} (${body.deal || "Sale"})
- Headline: ${body.title || "Not specified"}
- Area/Corridor context: ${location || "Commercial zone"}
- Writing Tone: ${tone}
${(body.photoCount || 0) > 0 ? "- Photos are attached: inspect the images carefully and highlight visible physical traits (road access, terrain flatness, boundary demarcation, shed height, loading bays, surroundings)." : "- No photos attached yet: focus on practical utility, road connectivity, legal readiness, and business suitability."}

Also provide 5 short, relevant highlight chips (2 to 3 words each) tailored to what is visible in the photos or ideal for this ${category}.`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const imageParts = (Array.isArray(body.images) ? body.images : [])
        .filter((img) => img && img.data && img.mimeType)
        .slice(0, 3)
        .map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } }));

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              highlightChips: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["description", "highlightChips"],
          },
        },
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.description) {
          return NextResponse.json({
            description: String(parsed.description).trim(),
            highlightChips: Array.isArray(parsed.highlightChips)
              ? parsed.highlightChips.slice(0, 5)
              : chipsFor(category),
            source: imageParts.length > 0 ? "photos" : "ai",
          });
        }
      }
    } catch {
      // fall through to the deterministic draft
    }
  }

  return NextResponse.json({
    description: draftFor(category, location),
    highlightChips: chipsFor(category),
    source: "draft",
  });
}
