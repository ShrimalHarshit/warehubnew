"use client";

import { ChevronLeft, Phone } from "lucide-react";
import { useWarehub } from "./store";

export function Detail() {
  const { selected, navigateTo } = useWarehub();

  if (!selected) return null;

  const prop = selected;
  const showOwnership = Boolean(prop.ownership);
  const showPossession = Boolean(prop.possession);
  const showUse = Boolean(prop.use);
  const activeSpecsCount =
    3 + (showOwnership ? 1 : 0) + (showPossession ? 1 : 0) + (showUse ? 1 : 0);
  const phoneDisplay = prop.phone || "+91 98230 44950";
  const tileClass = "bg-alabaster-card rounded-[16px] p-3";

  const sectionTitle = "font-display font-extrabold text-[11px] uppercase tracking-widest text-forest-800";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6 lg:p-8 lg:items-start">
      {/* Hero Photo Canvas */}
      <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[520px] lg:col-span-6 lg:rounded-[32px] overflow-hidden shrink-0 shadow-card border border-black/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={prop.image}
          alt={prop.title}
          onError={(e) => {
            e.currentTarget.src = "/images/site-land-1.jpg";
          }}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/35 via-transparent to-forest-950/30 pointer-events-none" />

        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
          <button
            onClick={() => navigateTo("home")}
            aria-label="Back to showcase"
            className="w-[42px] h-[42px] rounded-full bg-white shadow-soft flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-ink" />
          </button>
          <span className="bg-forest-900/85 backdrop-blur text-limepop text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full">
            {prop.category}
          </span>
        </div>
      </div>

      {/* Content Cards */}
      <div className="relative z-20 -mt-7 lg:mt-0 lg:col-span-6 px-4 sm:px-6 lg:px-0 space-y-3.5">
        {/* Primary Summary Card */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-card border border-black/[0.04]">
          <div className="flex items-start gap-3.5">
            <div className="w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-[20px] overflow-hidden shrink-0 bg-alabaster-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prop.image}
                alt={prop.title}
                onError={(e) => {
                  e.currentTarget.src = "/images/site-land-1.jpg";
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-extrabold tracking-widest uppercase bg-limepop text-forest-950 px-2.5 py-0.5 rounded-full">
                WAREHUB
              </span>

              <h2 className="font-display font-extrabold text-[17px] sm:text-[20px] text-ink truncate mt-1.5">
                {prop.title}
              </h2>

              <p className="text-[11.5px] sm:text-[12.5px] text-ink-muted leading-snug mt-0.5 line-clamp-2">
                {prop.location}
              </p>

              <div className="mt-3">
                <span className="font-display font-extrabold text-[20px] sm:text-[23px] text-forest-900 block leading-tight">
                  {prop.price}
                </span>
                <span className="text-[10.5px] text-ink-muted font-semibold block">
                  {prop.pricePerSqFt} / sq ft · {prop.negotiable || "Negotiable"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lot ID & Posted On Metadata Bar */}
        <div className="bg-white rounded-[22px] px-4 py-3.5 shadow-soft border border-black/[0.04] flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Lot ID:</span>
            <span className="font-display font-extrabold text-forest-950 bg-limepop px-2.5 py-1 rounded-full">
              {prop.lotId}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-ink-muted">Posted On:</span>
            <span className="font-bold text-ink">{prop.postedOn}</span>
          </div>
        </div>

        {/* Pricing & Area Card */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-soft border border-black/[0.04] space-y-3">
          <h3 className={sectionTitle}>Pricing &amp; Area</h3>
          <div className="flex items-center justify-between border-b border-forest-900/10 pb-2.5 gap-2">
            <span className="text-[12.5px] text-ink-muted">Asking Price</span>
            <span className="font-display font-extrabold text-[13px] text-ink text-right">
              {prop.price} ({prop.pricePerSqFt} per sq ft · {prop.negotiable || "Negotiable"})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-ink-muted">Area</span>
            <span className="font-display font-extrabold text-[13px] text-ink">{prop.area}</span>
          </div>
        </div>

        {/* Property Details Grid */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-soft border border-black/[0.04]">
          <h3 className={`${sectionTitle} mb-3`}>Property Details</h3>
          <div
            className={
              activeSpecsCount <= 3
                ? "grid grid-cols-3 gap-2.5"
                : "grid grid-cols-2 sm:grid-cols-3 gap-2.5"
            }
          >
            <div className={tileClass}>
              <span className="text-[10.5px] text-ink-muted block">Plot / Built Area</span>
              <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                {prop.area}
              </span>
            </div>
            <div className={tileClass}>
              <span className="text-[10.5px] text-ink-muted block">Property Type</span>
              <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                {prop.propertyTypeLabel}
              </span>
            </div>
            {showOwnership && (
              <div className={tileClass}>
                <span className="text-[10.5px] text-ink-muted block">Ownership</span>
                <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                  {prop.ownership}
                </span>
              </div>
            )}
            {showPossession && (
              <div className={tileClass}>
                <span className="text-[10.5px] text-ink-muted block">Possession</span>
                <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                  {prop.possession}
                </span>
              </div>
            )}
            {showUse && (
              <div className={tileClass}>
                <span className="text-[10.5px] text-ink-muted block">Use</span>
                <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                  {prop.use}
                </span>
              </div>
            )}
            <div className={tileClass}>
              <span className="text-[10.5px] text-ink-muted block">Price / Sq Ft</span>
              <span className="font-display font-extrabold text-[13px] text-ink mt-0.5 block">
                {prop.pricePerSqFt}
              </span>
            </div>
          </div>
        </div>

        {/* Description & Direct Contact Card */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-soft border border-black/[0.04] space-y-3">
          <h3 className={sectionTitle}>Description &amp; Contact</h3>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            {prop.description ||
              "Verified industrial site available for immediate sale via WAREHUB."}
          </p>
          <div className="pt-2 border-t border-forest-900/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-limepop-soft flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-forest-900" />
              </div>
              <div>
                <span className="text-[10.5px] text-ink-muted block">Direct Contact Number</span>
                <span className="font-display font-extrabold text-[13.5px] text-ink">
                  {phoneDisplay}
                </span>
              </div>
            </div>
            <a
              href={`tel:${phoneDisplay.replace(/\s+/g, "")}`}
              className="px-5 py-2.5 rounded-full bg-limepop hover:bg-limepop-hover text-forest-950 text-xs font-extrabold transition-colors"
            >
              Call Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
