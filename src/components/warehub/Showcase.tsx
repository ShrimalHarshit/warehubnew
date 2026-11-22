"use client";

import { useEffect } from "react";
import { Database, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useWarehub } from "./store";

const CATEGORIES = [
  { key: "All" as const, label: "All Sites" },
  { key: "Land" as const, label: "Land / Plot" },
  { key: "Warehouse" as const, label: "Warehouse" },
];

export function Showcase() {
  const {
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    visibleListings,
    isLoading,
    syncError,
    filterOpen,
    setFilterOpen,
    showcaseSort,
    applySort,
    resetFilters,
    openPropertyDetail,
    loadListings,
  } = useWarehub();

  // Refresh from warehub_listings whenever the showcase is (re)opened.
  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  return (
    <>
      {/* Search & Category Header */}
      <header className="sticky top-0 z-20 bg-alabaster/95 backdrop-blur-md px-5 md:px-8 pt-5 pb-3.5 border-b border-forest-900/10">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search className="w-[17px] h-[17px] text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plot, warehouse, Lot ID, Nashik..."
                className="area-input w-full h-[44px] pl-11 pr-4 rounded-full text-sm font-semibold text-ink placeholder-ink-muted/60"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              aria-label="Filter sites"
              className="w-[44px] h-[44px] rounded-full border border-forest-900/10 bg-white flex items-center justify-center shrink-0 hover:bg-limepop-soft active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-[17px] h-[17px] text-forest-900" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={
                  category === c.key
                    ? "px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all bg-forest-900 text-white shadow-sm"
                    : "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-white text-ink border border-black/5 hover:bg-alabaster"
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Land & Warehouse Grid */}
      <main className="px-5 md:px-8 pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-20 text-center px-6">
            <div className="w-10 h-10 rounded-full border-2 border-forest-900 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-display font-extrabold text-sm text-ink">
              Loading listings from the database...
            </p>
          </div>
        ) : visibleListings.length === 0 ? (
          <div className="col-span-full py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-limepop text-forest-950 flex items-center justify-center mx-auto mb-3">
              <Database className="w-5 h-5" />
            </div>
            <p className="font-display font-extrabold text-base text-ink">
              {syncError ? "Unable to load the database" : "No listings available"}
            </p>
            <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
              {syncError
                ? "Check the warehub_listings table and try refreshing."
                : "No records found in warehub_listings. Add a plot or warehouse via /newlisting."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => loadListings(false)}
                className="px-5 py-2.5 rounded-full bg-forest-900 text-white text-xs font-bold hover:bg-forest-800 transition-colors"
              >
                Refresh
              </button>
              {(searchQuery || category !== "All") && (
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-limepop text-forest-950 text-xs font-bold hover:bg-limepop-hover transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          visibleListings.map((prop) => (
            <article
              key={prop.id}
              role="button"
              tabIndex={0}
              onClick={() => openPropertyDetail(prop.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPropertyDetail(prop.id);
                }
              }}
              className="group relative h-[240px] sm:h-[260px] w-full rounded-[24px] overflow-hidden shadow-card cursor-pointer bg-alabaster-card transition-transform duration-300 hover:-translate-y-1 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prop.image}
                alt={prop.title}
                onError={(e) => {
                  if (!e.currentTarget.src.includes("/images/")) {
                    e.currentTarget.src = "/images/site-land-1.jpg";
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/45 via-transparent to-forest-950/10 pointer-events-none" />

              <div className="absolute top-3.5 left-3.5 bg-forest-900/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                {prop.category} • {prop.area}
              </div>

              {/* Floating White Info Overlay Card */}
              <div className="absolute bottom-3 left-3 right-3 bg-white rounded-[20px] px-4 py-3 shadow-soft border border-black/[0.04] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-[14.5px] text-ink truncate">
                    {prop.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-ink-muted mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-forest-700" />
                    <span className="truncate">{prop.location}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-extrabold text-[14.5px] text-forest-900">
                    {prop.price}
                  </div>
                  <div className="text-[10px] font-extrabold text-forest-900 bg-limepop-soft px-2 py-0.5 rounded-full mt-0.5 inline-block">
                    {prop.lotId}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Quick Filter Bottom Sheet Modal */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-40 bg-forest-950/50 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-[0_24px_60px_-15px_rgba(16,42,131,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-alabaster-card rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-lg text-ink">Filter Sites</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="w-9 h-9 rounded-full bg-alabaster hover:bg-alabaster-card flex items-center justify-center text-ink font-bold"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-ink block mb-2">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applySort("newest")}
                    className={
                      showcaseSort === "newest"
                        ? "py-2.5 px-3 rounded-xl border border-forest-900 bg-forest-900 text-white text-xs font-bold"
                        : "py-2.5 px-3 rounded-xl border border-black/5 bg-alabaster text-ink text-xs font-bold hover:bg-alabaster-card"
                    }
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => applySort("price-asc")}
                    className={
                      showcaseSort === "price-asc"
                        ? "py-2.5 px-3 rounded-xl border border-forest-900 bg-forest-900 text-white text-xs font-bold"
                        : "py-2.5 px-3 rounded-xl border border-black/5 bg-alabaster text-ink text-xs font-bold hover:bg-alabaster-card"
                    }
                  >
                    Price: Low to High
                  </button>
                </div>
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full h-11 rounded-full bg-limepop hover:bg-limepop-hover text-forest-950 text-sm font-extrabold mt-2 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
