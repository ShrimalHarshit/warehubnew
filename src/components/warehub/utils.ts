import type { Listing } from "./types";

/** Site photography bundled with the app (replaces the original Unsplash hotlinks). */
export const SAMPLE_IMAGES = [
  "/images/site-land-1.jpg",
  "/images/site-warehouse-1.jpg",
  "/images/site-land-2.jpg",
  "/images/site-warehouse-2.jpg",
];

export function parseNumericArea(val: string): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, "").match(/[\d.]+/);
  return cleaned ? parseFloat(cleaned[0]) : 0;
}

export function parseRupeeAmount(val: string): number {
  if (!val) return 0;
  const str = String(val).replace(/₹|,/g, "").trim().toLowerCase();
  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[0]);
  if (isNaN(num)) return 0;
  if (str.includes("cr")) return num * 10000000;
  if (str.includes("l")) return num * 100000;
  if (str.includes("k")) return num * 1000;
  return num;
}

export function formatIndianPriceDisplay(rawStr: string, numericVal: number): string {
  const lower = String(rawStr).toLowerCase();
  if (lower.includes("l") || lower.includes("cr")) {
    const clean = String(rawStr).replace(/^₹\s*/i, "").trim();
    return `₹${clean}`;
  }
  if (numericVal >= 10000000) {
    return `₹${(numericVal / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (numericVal >= 100000) {
    return `₹${(numericVal / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  }
  return `₹${numericVal.toLocaleString("en-IN")}`;
}

export function generateNextLotId(list: Listing[]): string {
  let maxNum = 4518;
  list.forEach((p) => {
    const match = String(p.lotId || "").match(/WH-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return `WH-${maxNum + 1}`;
}

export function todayFormatted(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fieldValue(id: string): string {
  if (typeof document === "undefined") return "";
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return (el?.value || "").trim();
}

/**
 * Reads a picked photo, downscales it to a sane width and returns base64
 * (no `data:` prefix) ready for POST /api/images.
 */
export async function fileToCompressedBase64(
  file: File,
  maxWidth = 1400,
  quality = 0.82,
): Promise<{ dataB64: string; mime: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
  const originalB64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";

  try {
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file is not a readable image"));
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxWidth / (img.width || maxWidth));
    const width = Math.max(1, Math.round((img.width || maxWidth) * scale));
    const height = Math.max(1, Math.round((img.height || maxWidth) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataB64: originalB64, mime: file.type || "image/jpeg" };
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    return { dataB64: out.includes(",") ? out.split(",")[1] : "", mime: "image/jpeg" };
  } catch {
    return { dataB64: originalB64, mime: file.type || "image/jpeg" };
  }
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
