"use client";

import { useRef, useState } from "react";
import { useWarehub } from "./store";
import { fileToCompressedBase64, todayFormatted } from "./utils";

type Photo = { url: string; b64?: string; mime?: string };
type Category = "Land Plot" | "Warehouse";

const GENERALIZED_TAGS: Record<Category, string[]> = {
  "Land Plot": [
    "Clear & Marketable Title",
    "Wide Tar Road Frontage",
    "Water & Power Connection",
    "Fenced & Demarcated",
    "Immediate Possession",
  ],
  Warehouse: [
    "28ft+ Center Height",
    "Heavy Dock Access",
    "3-Phase Industrial Power",
    "VDF Trimix Flooring",
    "Fire NOC Compliant",
  ],
};

const TONES = ["Practical & Crisp", "Investor & Commercial", "Direct Owner Pitch"];

function toSqft(value: number, unit: string) {
  if (unit === "acres") return Math.round(value * 43560);
  if (unit === "guntha") return Math.round(value * 1089);
  return Math.round(value);
}

function formatMoney(value: number, currency: string) {
  return value.toLocaleString(currency === "₹" ? "en-IN" : "en-US");
}

function draftFor(category: Category, location: string) {
  const corridor = location.trim().length > 2 ? location.trim() : "the Nashik corridor";
  return category === "Warehouse"
    ? `Ready-to-operate storage facility off ${corridor}, with a wide turning radius for articulated vehicles and uninterrupted power for seamless logistics operations.`
    : `Well-demarcated parcel along ${corridor} offering level terrain, smooth road connectivity and clean documentation — ideal for immediate commercial development or long-term capital growth.`;
}

const BrandMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" style={{ fill: "var(--brand-900)" }} />
    <path d="M10 14L18 9L26 14L23 24H13L10 14Z" style={{ fill: "var(--accent-main)" }} />
    <path
      d="M18 9V24M10 14L23 24M26 14L13 24"
      style={{ stroke: "var(--brand-900)" }}
      strokeWidth="1.8"
    />
  </svg>
);

export type ListingWizardInitialData = {
  category?: Category;
  title?: string;
  photos?: string[];
  location?: string;
  areaVal?: string;
  unit?: string;
  currency?: string;
  price?: string;
  deal?: "Sale" | "Rent";
  phone?: string;
  description?: string;
  selectedTags?: string[];
};

export type ListingWizardSubmitPayload = {
  lotId: string;
  categoryKey: "Land" | "Warehouse";
  title: string;
  location: string;
  rawArea: string;
  areaLabel: string;
  numericArea: number;
  rawPrice: string;
  priceLabel: string;
  numericPrice: number;
  pricePerSqFt: string;
  negotiable: string;
  phoneDisplay: string;
  description: string;
  highlights: string[];
  image: string;
};

export type NewListingProps = {
  initialData?: ListingWizardInitialData;
  fixedLotId?: string;
  submitLabel?: string;
  successHeading?: string;
  successDescription?: string;
  primarySuccessLabel?: string;
  secondarySuccessLabel?: string;
  onPrimarySuccess?: () => void;
  onSecondarySuccess?: () => void;
  onSubmitOverride?: (payload: ListingWizardSubmitPayload) => Promise<{ lotId: string }>;
};

export function NewListing({
  initialData,
  fixedLotId,
  submitLabel,
  successHeading,
  successDescription,
  primarySuccessLabel,
  secondarySuccessLabel,
  onPrimarySuccess,
  onSecondarySuccess,
  onSubmitOverride,
}: NewListingProps = {}) {
  const { nextLotId, navigateTo, showToast } = useWarehub();

  const formRef = useRef<HTMLFormElement>(null);
  const toneIndex = useRef(0);
  const activeLotId = fixedLotId || nextLotId;

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category>(initialData?.category || "Land Plot");
  const [title, setTitle] = useState(initialData?.title || "");
  const [photos, setPhotos] = useState<Photo[]>(
    (initialData?.photos || []).map((url) => ({ url })),
  );
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(initialData?.location || "");
  const [areaVal, setAreaVal] = useState(initialData?.areaVal || "");
  const [unit, setUnit] = useState(initialData?.unit || "acres");
  const [currency, setCurrency] = useState(initialData?.currency || "₹");
  const [price, setPrice] = useState(initialData?.price || "");
  const [deal, setDeal] = useState<"Sale" | "Rent">(initialData?.deal || "Sale");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.selectedTags || []);
  const [customSuggestions, setCustomSuggestions] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBadge, setAiBadge] = useState("• Vision Ready");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ lotId: string; brief: string } | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tags = customSuggestions && customSuggestions.length ? customSuggestions : GENERALIZED_TAGS[category];
  const areaNum = Number(areaVal) || 0;
  const priceNum = Number(price) || 0;
  const sqft = toSqft(areaNum, unit);
  const showRate = priceNum > 0 && areaNum > 0;

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }

  /* ------------------------------------------------------------ navigation */

  function goToStep(next: number) {
    if (next < 1 || next > 4) return;
    const previous = step;
    setStep(next);
    if (next === 4 && previous !== 4 && !desc.trim()) {
      void generateAIDescription(false);
    }
  }

  function nextStep() {
    if (step === 1 && title.trim().length < 3) {
      notify("Add a listing headline first");
      return;
    }
    if (step === 3) {
      if (!areaNum || areaNum <= 0) {
        notify("Enter the total area");
        return;
      }
      if (!priceNum || priceNum <= 0) {
        notify("Enter the asking price");
        return;
      }
    }
    if (step < 4) {
      goToStep(step + 1);
      return;
    }
    void handlePublish();
  }

  function prevStep() {
    if (step > 1) goToStep(step - 1);
  }

  /* ----------------------------------------------------------------- photos */

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const slots = 6 - photos.length;
    if (slots <= 0) {
      notify("Maximum 6 photos reached");
      return;
    }
    const chosen = Array.from(files)
      .slice(0, slots)
      .filter((f) => f.type.startsWith("image/"));
    if (chosen.length === 0) {
      notify("Please pick an image file");
      return;
    }

    setUploading(true);
    const uploaded: Photo[] = [];
    for (const file of chosen) {
      try {
        const { dataB64, mime } = await fileToCompressedBase64(file);
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lotId: activeLotId, mime, dataB64, position: uploaded.length }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
        uploaded.push({ url: data.url, b64: dataB64, mime });
      } catch (error) {
        notify(`Photo failed: ${error instanceof Error ? error.message : "upload error"}`);
      }
    }
    if (uploaded.length) setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  function deletePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  /* ------------------------------------------------------------------- tags */

  function toggleTag(tag: string) {
    const isSelected = selectedTags.includes(tag);
    setSelectedTags((prev) => (isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]));
    const parts = desc
      .split(" • ")
      .map((s) => s.trim())
      .filter((s) => s && s !== tag);
    setDesc(isSelected ? parts.join(" • ") : parts.length ? `${parts.join(" • ")} • ${tag}` : tag);
  }

  /* ------------------------------------------------------------- AI rewrite */

  async function generateAIDescription(force: boolean) {
    if (aiLoading) return;
    if (!force && desc.trim()) return;

    const tone = TONES[toneIndex.current % TONES.length];
    toneIndex.current += 1;
    setAiLoading(true);
    setAiBadge("• Generating...");

    try {
      const images = photos
        .slice(0, 2)
        .filter((p) => p.b64)
        .map((p) => ({ mimeType: p.mime || "image/jpeg", data: p.b64 as string }));

      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          location,
          area: `${areaVal} ${unit}`,
          deal,
          tone,
          photoCount: photos.length,
          images,
        }),
      });
      const data = (await res.json()) as {
        description?: string;
        highlightChips?: string[];
        source?: string;
        error?: string;
      };
      if (!res.ok || !data.description) throw new Error(data.error || "No description returned");

      setDesc(data.description);
      if (Array.isArray(data.highlightChips) && data.highlightChips.length) {
        setCustomSuggestions(data.highlightChips.slice(0, 5));
      }
      setAiBadge(
        data.source === "photos"
          ? "• From Photos"
          : data.source === "ai"
            ? `• ${tone.split(" ")[0]}`
            : "• Smart Draft",
      );
      if (force) notify("AI updated description from context");
    } catch {
      if (!desc.trim() || force) setDesc(draftFor(category, location));
      setAiBadge("• Smart Draft");
    } finally {
      setAiLoading(false);
    }
  }

  /* --------------------------------------------------------------- publish */

  function buildBrief(lotId: string) {
    const areaLabel = `${areaVal || "0"} ${unit}`;
    const priceLabel = `${currency}${formatMoney(priceNum, currency)}${deal === "Rent" ? " / month" : ""}`;
    return (
      `${category.toUpperCase()} (${deal === "Rent" ? "FOR LEASE" : "FOR SALE"})\n` +
      `Lot ID: ${lotId}\n` +
      `Title: ${title.trim()}\n` +
      `Location: ${location.trim()}\n` +
      `Area: ${areaLabel}\n` +
      `Price: ${priceLabel}\n` +
      `Phone: +91 ${phone.trim()}\n\n` +
      `${desc.trim() || draftFor(category, location)}`
    );
  }

  async function handlePublish() {
    if (publishing) return;
    if (title.trim().length < 3) {
      setStep(1);
      notify("Add a listing headline first");
      return;
    }
    if (!location.trim()) {
      setStep(3);
      notify("Add the location");
      return;
    }
    if (!areaNum || areaNum <= 0) {
      setStep(3);
      notify("Enter the total area");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      setStep(3);
      notify("Enter the asking price");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setStep(4);
      notify("Enter a valid phone number");
      return;
    }

    setPublishing(true);
    try {
      const categoryKey: "Land" | "Warehouse" = category === "Warehouse" ? "Warehouse" : "Land";
      const areaLabel = `${areaNum.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`;
      const priceLabel = `${currency}${formatMoney(priceNum, currency)}${deal === "Rent" ? " /Mo" : ""}`;
      const ppsf =
        sqft > 0 ? `${currency}${formatMoney(Math.round(priceNum / sqft), currency)}` : "₹0";
      const phoneDisplay = phone.trim().startsWith("+") ? phone.trim() : `+91 ${phone.trim()}`;
      const finalLotId = activeLotId;

      const payload: ListingWizardSubmitPayload = {
        lotId: finalLotId,
        categoryKey,
        title: title.trim(),
        location: location.trim(),
        rawArea: `${areaVal}`,
        areaLabel,
        numericArea: sqft,
        rawPrice: `${currency}${priceNum}`,
        priceLabel,
        numericPrice: priceNum,
        pricePerSqFt: ppsf,
        negotiable: deal === "Rent" ? "Rent / Mo" : "Negotiable",
        phoneDisplay,
        description: desc.trim() || draftFor(category, location),
        highlights: selectedTags,
        image: photos[0]?.url || "/images/site-land-1.jpg",
      };

      const saved = onSubmitOverride
        ? await onSubmitOverride(payload)
        : await (async () => {
            const res = await fetch("/api/listings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                listing: {
                  id: Date.now(),
                  lotId: payload.lotId,
                  postedOn: todayFormatted(),
                  title: payload.title,
                  location: payload.location,
                  price: payload.priceLabel,
                  numericPrice: payload.numericPrice,
                  pricePerSqFt: payload.pricePerSqFt,
                  negotiable: payload.negotiable,
                  category: payload.categoryKey,
                  propertyTypeLabel:
                    payload.categoryKey === "Land" ? "Land / Plot" : "Warehouse / Shed",
                  area: payload.areaLabel,
                  numericArea: payload.numericArea,
                  ownership: "",
                  possession: "",
                  use: "",
                  phone: payload.phoneDisplay,
                  description: payload.description,
                  highlights: payload.highlights,
                  image: payload.image,
                },
              }),
            });
            const data = (await res.json()) as { listing?: { lotId: string }; error?: string };
            if (!res.ok || !data.listing) throw new Error(data.error || "Failed to save listing");
            return { lotId: data.listing.lotId };
          })();

      setPublished({ lotId: saved.lotId, brief: buildBrief(saved.lotId) });
      notify(`${saved.lotId} saved to warehub_listings`);
    } catch (error) {
      notify(`Publish failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setPublishing(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setCategory(initialData?.category || "Land Plot");
    setTitle(initialData?.title || "");
    setPhotos((initialData?.photos || []).map((url) => ({ url })));
    setLocation(initialData?.location || "");
    setAreaVal(initialData?.areaVal || "");
    setUnit(initialData?.unit || "acres");
    setCurrency(initialData?.currency || "₹");
    setPrice(initialData?.price || "");
    setDeal(initialData?.deal || "Sale");
    setPhone(initialData?.phone || "");
    setDesc(initialData?.description || "");
    setSelectedTags(initialData?.selectedTags || []);
    setCustomSuggestions(null);
    setAiBadge("• Vision Ready");
    setPublished(null);
    toneIndex.current = 0;
    formRef.current?.reset();
  }

  function handlePrimarySuccess() {
    setPublished(null);
    if (onPrimarySuccess) {
      onPrimarySuccess();
      return;
    }
    resetWizard();
    navigateTo("home");
  }

  function handleSecondarySuccess() {
    if (onSecondarySuccess) {
      setPublished(null);
      onSecondarySuccess();
      return;
    }
    resetWizard();
  }

  function copyBrief() {
    const text = published?.brief || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => notify("Listing brief copied"))
        .catch(() => notify("Brief ready"));
      return;
    }
    notify("Brief ready");
  }

  const inputClass =
    "area-input w-full px-4 py-3.5 rounded-2xl text-sm font-semibold text-ink placeholder-ink-muted/60";

  const stepBadge = (
    <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-forest-800 bg-limepop-soft px-2.5 py-0.5 rounded-full mb-2">
      Step 0{step} of 04
    </span>
  );

  return (
    <section className="flex-1 flex flex-col bg-white">
      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* FULL-SCREEN WIZARD — no outer wrapper, white fills the viewport */}
          <section className="flex-1 flex flex-col justify-between gap-4 px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
            {/* Progress bar only — no brand mark, no step pill */}
            <div className="flex items-center gap-2 shrink-0">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-label={`Step ${i}`}
                  className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                    i <= step ? "bg-forest-900" : "bg-alabaster-card"
                  }`}
                />
              ))}
            </div>

            {/* FORM PAGES CONTAINER */}
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                nextStep();
              }}
              className="flex-1 flex flex-col justify-center"
            >
              {/* ========================= PAGE 1: TYPE & TITLE */}
              {step === 1 && (
                <div className="step-page space-y-5 sm:space-y-6">
                  <div>
                    {stepBadge}
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">
                      What kind of space are you listing?
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1">
                      Choose land plots for construction &amp; business, or commercial warehouse
                      spaces.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setCategory("Land Plot")}
                      className={`p-4 sm:p-5 rounded-[22px] text-left transition-all cursor-pointer flex flex-col justify-between min-h-[128px] sm:min-h-[144px] ${
                        category === "Land Plot"
                          ? "bg-forest-900 text-white ring-2 ring-forest-900 shadow-md shadow-forest-900/15"
                          : "bg-alabaster-light hover:bg-alabaster text-ink border border-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                            category === "Land Plot"
                              ? "bg-limepop text-forest-950"
                              : "bg-white text-forest-900 shadow-sm"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="4 6 14 3 20 10 16 20 5 18 4 6" />
                            <line x1="14" y1="3" x2="10" y2="19" />
                          </svg>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                            category === "Land Plot"
                              ? "bg-limepop text-forest-950"
                              : "border border-black/15 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-sm sm:text-base">Land &amp; Plot</p>
                        <p
                          className={`text-[11px] ${
                            category === "Land Plot" ? "text-white/70" : "text-ink-muted"
                          }`}
                        >
                          NA Plot, Agro, Industrial
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("Warehouse")}
                      className={`p-4 sm:p-5 rounded-[22px] text-left transition-all cursor-pointer flex flex-col justify-between min-h-[128px] sm:min-h-[144px] ${
                        category === "Warehouse"
                          ? "bg-forest-900 text-white ring-2 ring-forest-900 shadow-md shadow-forest-900/15"
                          : "bg-alabaster-light hover:bg-alabaster text-ink border border-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                            category === "Warehouse"
                              ? "bg-limepop text-forest-950"
                              : "bg-white text-forest-900 shadow-sm"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                            <path d="M9 21V12h6v9" />
                          </svg>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                            category === "Warehouse"
                              ? "bg-limepop text-forest-950"
                              : "border border-black/15 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-sm sm:text-base">Warehouse</p>
                        <p
                          className={`text-[11px] ${
                            category === "Warehouse" ? "text-white/70" : "text-ink-muted"
                          }`}
                        >
                          Logistics Shed, Storage
                        </p>
                      </div>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="f-title"
                        className="text-[11px] font-bold uppercase tracking-wider text-ink"
                      >
                        Listing Headline
                      </label>
                      <span className="text-[11px] font-medium text-ink-muted">
                        {title.length}/70
                      </span>
                    </div>
                    <input
                      id="f-title"
                      type="text"
                      maxLength={70}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Industrial NA Plot on Highway"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* ========================= PAGE 2: PHOTOS */}
              {step === 2 && (
                <div className="step-page space-y-4 sm:space-y-5">
                  <div>
                    {stepBadge}
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">
                      Showcase the land or warehouse.
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1">
                      Aerial views, road frontage, or interior bay photos build immediate buyer
                      trust.
                    </p>
                  </div>

                  <div
                    onClick={() => document.getElementById("f-photos")?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void onFilesSelected(e.dataTransfer.files);
                    }}
                    className="rounded-[24px] border-2 border-dashed border-forest-900/20 hover:border-forest-900 bg-alabaster-light/80 p-5 sm:p-7 text-center cursor-pointer transition-all group"
                  >
                    <input
                      id="f-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void onFilesSelected(e.target.files);
                        e.target.value = "";
                      }}
                    />

                    <div className="w-11 h-11 mx-auto rounded-2xl bg-limepop text-forest-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mb-2.5">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-ink">
                      {uploading ? "Uploading to warehub_images..." : "Tap to upload photos"}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Up to 6 images • First photo becomes cover
                    </p>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-6 gap-2">
                      {photos.map((photo, i) => (
                        <div
                          key={`${photo.url}-${i}`}
                          className="relative aspect-square rounded-2xl overflow-hidden bg-alabaster-card border border-black/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`Site ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-forest-900 text-limepop text-[9px] font-extrabold">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => deletePhoto(i)}
                            aria-label={`Remove photo ${i + 1}`}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white text-xs flex items-center justify-center hover:bg-red-600 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================= PAGE 3: LOCATION, AREA & PRICE */}
              {step === 3 && (
                <div className="step-page space-y-4">
                  <div>
                    {stepBadge}
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">
                      Location, dimensions &amp; price.
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1">
                      Automatically computes per-unit valuation for buyers.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="f-location"
                      className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5"
                    >
                      Location / Highway Corridor
                    </label>
                    <input
                      id="f-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Ambad MIDC, Nashik, Maharashtra"
                      className="area-input w-full px-4 py-3 rounded-2xl text-sm font-semibold text-ink placeholder-ink-muted/60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="f-area"
                        className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5"
                      >
                        Total Area
                      </label>
                      <div className="flex rounded-2xl overflow-hidden bg-alabaster-light border border-forest-900/10 focus-within:ring-2 focus-within:ring-forest-900">
                        <input
                          id="f-area"
                          type="number"
                          min={1}
                          step="any"
                          value={areaVal}
                          onChange={(e) => setAreaVal(e.target.value)}
                          placeholder="79.40"
                          className="w-full bg-transparent px-3.5 py-3 text-sm font-bold text-ink placeholder-ink-muted/60 focus:outline-none"
                        />
                        <select
                          aria-label="Area unit"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="bg-alabaster px-2.5 text-xs font-bold text-forest-900 focus:outline-none cursor-pointer"
                        >
                          <option value="acres">acres</option>
                          <option value="sq.ft">sq.ft</option>
                          <option value="guntha">guntha</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="f-price"
                        className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5"
                      >
                        Asking Price
                      </label>
                      <div className="flex rounded-2xl overflow-hidden bg-alabaster-light border border-forest-900/10 focus-within:ring-2 focus-within:ring-forest-900">
                        <select
                          aria-label="Currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="bg-alabaster px-2.5 text-xs font-extrabold text-forest-900 focus:outline-none cursor-pointer"
                        >
                          <option value="₹">₹</option>
                          <option value="$">$</option>
                        </select>
                        <input
                          id="f-price"
                          type="number"
                          min={1}
                          step="any"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="1620000"
                          className="w-full bg-transparent px-3 py-3 text-sm font-bold text-ink placeholder-ink-muted/60 focus:outline-none"
                        />
                        <select
                          aria-label="Deal type"
                          value={deal}
                          onChange={(e) => setDeal(e.target.value as "Sale" | "Rent")}
                          className="bg-alabaster px-2 text-xs font-bold text-ink focus:outline-none cursor-pointer"
                        >
                          <option value="Sale">Sale</option>
                          <option value="Rent">/Mo</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {showRate && (
                    <div className="rounded-2xl bg-forest-900 text-white px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-limepop text-forest-950 font-extrabold text-xs flex items-center justify-center">
                          %
                        </span>
                        <span className="text-xs font-medium text-white/85">
                          Smart Valuation Rate
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-limepop">
                        {currency}
                        {formatMoney(Math.round(priceNum / areaNum), currency)} / {unit}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ========================= PAGE 4: PHONE & DESCRIPTION */}
              {step === 4 && (
                <div className="step-page space-y-4">
                  <div>
                    {stepBadge}
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">
                      Direct phone &amp; site notes.
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1">
                      Buyers will reach out directly to this number without middlemen.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="f-phone"
                      className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5"
                    >
                      Phone Number
                    </label>
                    <div className="flex rounded-2xl overflow-hidden bg-alabaster-light border border-forest-900/10 focus-within:ring-2 focus-within:ring-forest-900">
                      <span className="bg-alabaster px-3.5 flex items-center text-xs font-extrabold text-forest-900">
                        +91
                      </span>
                      <input
                        id="f-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98230 45120"
                        className="w-full bg-transparent px-3.5 py-3 text-sm font-bold text-ink placeholder-ink-muted/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <label
                        htmlFor="f-desc"
                        className="text-[11px] font-bold uppercase tracking-wider text-ink"
                      >
                        Description
                      </label>
                      <button
                        type="button"
                        onClick={() => void generateAIDescription(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-900 bg-limepop-soft hover:bg-limepop px-3 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        <span>✨</span>
                        <span>AI Rewrite</span>
                        <span className="text-[10px] font-extrabold text-forest-950/70">
                          {aiBadge}
                        </span>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        id="f-desc"
                        rows={3}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="AI will analyze your photos & site specs automatically..."
                        className="area-input w-full p-3.5 rounded-2xl text-sm font-medium text-ink placeholder-ink-muted/60 leading-snug resize-none"
                      />
                      {aiLoading && (
                        <div className="absolute inset-0 rounded-2xl bg-white/85 backdrop-blur-[2px] flex items-center justify-center gap-2 border border-forest-900/15">
                          <span className="w-2 h-2 rounded-full bg-forest-900 animate-bounce" />
                          <span
                            className="w-2 h-2 rounded-full bg-limepop-hover animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-forest-900 animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          />
                          <span className="text-xs font-bold text-forest-900 ml-1">
                            Analyzing photos &amp; site details...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-forest-900 text-white border-forest-900"
                                : "bg-alabaster text-ink border-black/5 hover:bg-limepop"
                            }`}
                          >
                            {isSelected ? "✓" : "+"} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* BOTTOM PAGINATION CONTROLS */}
            <div className="pt-4 border-t border-forest-900/8 flex items-center justify-between gap-3 shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3.5 rounded-full bg-alabaster-light hover:bg-alabaster text-ink font-bold text-sm transition-all cursor-pointer border border-black/5"
                >
                  ← Back
                </button>
              ) : (
                <div className="block" />
              )}

              <button
                type="button"
                onClick={nextStep}
                disabled={publishing || uploading}
                className="flex-1 sm:flex-initial sm:min-w-[200px] py-3.5 px-7 rounded-full bg-limepop hover:bg-limepop-hover text-forest-950 font-extrabold text-sm tracking-tight shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span>
                  {publishing
                    ? "Publishing..."
                    : uploading
                      ? "Uploading..."
                      : step === 4
                        ? (submitLabel || "Publish Listing")
                        : "Continue"}
                </span>
                <span>→</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {published && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-forest-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-7 shadow-2xl border border-black/[0.06] flex flex-col items-center text-center gap-5">
            {/* Badge */}
            <span className="px-3.5 py-1.5 rounded-full bg-limepop text-forest-950 text-[11px] font-extrabold uppercase tracking-wider">
              Listing Ready
            </span>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-limepop-soft flex items-center justify-center">
              <svg className="w-8 h-8 text-forest-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Text */}
            <div>
              <h3 className="text-[22px] font-extrabold text-ink tracking-tight leading-tight">
                {successHeading || "Your listing is live."}
              </h3>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                Saved as{" "}
                <span className="font-extrabold text-forest-900">{published.lotId}</span>
                {" "}in warehub_listings.
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePrimarySuccess}
                className="w-full py-3.5 rounded-full bg-forest-900 hover:bg-forest-800 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                {primarySuccessLabel || "View Your Listing"}
              </button>
              <button
                type="button"
                onClick={handleSecondarySuccess}
                className="w-full py-3.5 rounded-full bg-alabaster hover:bg-alabaster-card text-ink font-bold text-sm transition-colors cursor-pointer border border-black/5"
              >
                {secondarySuccessLabel || "List another property"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL PILL TOAST */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="px-5 py-3 rounded-full bg-forest-900 text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-limepop" />
          <span>{toast || "Updated"}</span>
        </div>
      </div>
    </section>
  );
}


