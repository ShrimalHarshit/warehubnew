"use client";

import { useState } from "react";
import {
  ChevronLeft,
  CirclePlus,
  Download,
  FileCode,
  Link as LinkIcon,
  LogOut,
  Pencil,
  Search,
  ShieldLock,
  Table2,
  Trash,
} from "lucide-react";
import { useWarehub } from "./store";
import type { Listing } from "./types";
import {
  NewListing,
  type ListingWizardInitialData,
  type ListingWizardSubmitPayload,
} from "./NewListing";
import { parseRupeeAmount } from "./utils";

const inputClass =
  "w-full h-[46px] rounded-2xl border border-gray-200 bg-[#FAFAFA] focus:bg-white px-4 text-[13.5px] text-black focus:outline-none focus:border-black transition-colors";

function parseAreaForWizard(area: string) {
  const cleaned = String(area || "").trim();
  if (cleaned.toLowerCase().includes("acre")) {
    return { areaVal: cleaned.replace(/acres?/i, "").replace(/,/g, "").trim(), unit: "acres" };
  }
  if (cleaned.toLowerCase().includes("guntha")) {
    return { areaVal: cleaned.replace(/guntha/i, "").replace(/,/g, "").trim(), unit: "guntha" };
  }
  return { areaVal: cleaned.replace(/sq\s*ft/i, "").replace(/,/g, "").trim(), unit: "sq.ft" };
}

function parsePriceForWizard(price: string, negotiable: string) {
  const currency = String(price || "").trim().startsWith("$") ? "$" : "₹";
  const numeric = parseRupeeAmount(price);
  const deal = /rent/i.test(negotiable || "") ? "Rent" : "Sale";
  return { currency, price: numeric > 0 ? String(numeric) : "", deal: deal as "Sale" | "Rent" };
}

function listingToWizardInitialData(listing: Listing): ListingWizardInitialData {
  const area = parseAreaForWizard(listing.area);
  const price = parsePriceForWizard(listing.price, listing.negotiable);
  return {
    category: listing.category === "Warehouse" ? "Warehouse" : "Land Plot",
    title: listing.title,
    photos: listing.image ? [listing.image] : [],
    location: listing.location,
    areaVal: area.areaVal,
    unit: area.unit,
    currency: price.currency,
    price: price.price,
    deal: price.deal,
    phone: listing.phone.replace(/^\+91\s*/i, "").trim(),
    description: listing.description,
  };
}

function LoginGate() {
  const { navigateTo, handleAdminLogin, showToast } = useWarehub();
  const [error, setError] = useState(false);

  return (
    <div className="max-w-md mx-auto w-full my-auto py-8">
      <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-dock space-y-5">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center">
            <ShieldLock className="w-5 h-5" />
          </div>
          <button
            onClick={() => navigateTo("home")}
            className="text-xs font-semibold text-gray-500 hover:text-black px-3 py-1.5 rounded-full bg-[#F6F6F6]"
          >
            Back to Home
          </button>
        </div>
        <div>
          <h2 className="font-display font-extrabold text-[22px] text-black">Admin Verification</h2>
          <p className="text-[12.5px] text-[#7A7A7A] mt-1">
            Enter your Admin ID and Password to manage listings, edit records and export data.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const id = String(form.get("id") || "").trim();
            const pass = String(form.get("pass") || "").trim();
            const success = await handleAdminLogin(id, pass);
            if (success) {
              setError(false);
            } else {
              setError(true);
              showToast("Invalid Admin ID or Password");
            }
          }}
          className="space-y-3.5"
        >
          <div>
            <label htmlFor="admin-login-id" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Admin ID
            </label>
            <input id="admin-login-id" name="id" type="text" required placeholder="admin" className={inputClass} />
          </div>
          <div>
            <label htmlFor="admin-login-pass" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input id="admin-login-pass" name="pass" type="password" required placeholder="••••••••" className={inputClass} />
          </div>
          <p
            className={
              error
                ? "text-[12px] font-medium text-red-600 bg-red-50 px-3.5 py-2 rounded-xl"
                : "hidden text-[12px] font-medium text-red-600 bg-red-50 px-3.5 py-2 rounded-xl"
            }
          >
            Invalid Admin ID or Password.
          </p>
          <button
            type="submit"
            className="w-full h-[48px] rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-[13.5px] font-semibold transition-all shadow-sm mt-1"
          >
            Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}

function EditModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { updateListing } = useWarehub();

  async function handleEditSubmit(payload: ListingWizardSubmitPayload) {
    const saved = await updateListing(listing.id, {
      title: payload.title,
      location: payload.location,
      price: payload.priceLabel,
      numericPrice: payload.numericPrice,
      pricePerSqFt: payload.pricePerSqFt,
      negotiable: payload.negotiable,
      category: payload.categoryKey,
      propertyTypeLabel: payload.categoryKey === "Land" ? "Land / Plot" : "Warehouse / Shed",
      area: payload.areaLabel,
      numericArea: payload.numericArea,
      phone: payload.phoneDisplay,
      description: payload.description,
      image: payload.image,
    });
    return { lotId: saved.lotId };
  }

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm overflow-y-auto">
      {/* Close button — always visible top-right */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close editor"
        className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-white border-2 border-forest-900/15 shadow-lg flex items-center justify-center text-ink hover:bg-alabaster hover:border-forest-900 transition-all active:scale-95 cursor-pointer"
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="min-h-screen p-3 sm:p-5">
        {/* Editing badge */}
        <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest-900 bg-limepop px-3.5 py-1.5 rounded-full shadow-sm border border-limepop-hover">
            ✏️ Editing {listing.lotId}
          </span>
        </div>

        <NewListing
          key={listing.id}
          fixedLotId={listing.lotId}
          initialData={listingToWizardInitialData(listing)}
          submitLabel="Save Changes"
          successHeading="Listing updated."
          successDescription="Your changes are saved to warehub_listings. Copy the brief or return to the listings table."
          primarySuccessLabel="Back to Listings"
          secondarySuccessLabel="Continue Editing"
          onPrimarySuccess={onClose}
          onSecondarySuccess={() => undefined}
          onSubmitOverride={handleEditSubmit}
        />
      </div>
    </div>
  );
}

function ListingsTable() {
  const {
    adminListings,
    adminSearch,
    setAdminSearch,
    adminTypeFilter,
    setAdminTypeFilter,
    adminSort,
    setAdminSort,
    exportCSV,
    exportJSON,
    openPropertyDetail,
    deleteListing,
  } = useWarehub();

  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-[16px] text-black">All Submitted Listings</h3>
          <p className="text-[12px] text-[#7A7A7A]">Filter, sort, inspect, edit, and export data to CSV or JSON</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-[12px] font-semibold transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button onClick={exportJSON} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F6F6F6] hover:bg-gray-200 text-black text-[12px] font-semibold transition-all">
            <FileCode className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder="Filter by Lot ID, title, phone..."
            className="w-full h-[40px] pl-10 pr-3 rounded-full border border-gray-200 bg-[#FAFAFA] text-[12.5px] text-black focus:outline-none focus:border-black"
          />
        </div>
        <select value={adminTypeFilter} onChange={(e) => setAdminTypeFilter(e.target.value)} className="w-full h-[40px] px-4 rounded-full border border-gray-200 bg-[#FAFAFA] text-[12.5px] font-medium text-black focus:outline-none focus:border-black">
          <option value="All">Category: All Sites</option>
          <option value="Land">Category: Land / Plot Only</option>
          <option value="Warehouse">Category: Warehouse Only</option>
        </select>
        <select value={adminSort} onChange={(e) => setAdminSort(e.target.value as typeof adminSort)} className="w-full h-[40px] px-4 rounded-full border border-gray-200 bg-[#FAFAFA] text-[12.5px] font-medium text-black focus:outline-none focus:border-black">
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="price-desc">Sort: Price (High to Low)</option>
          <option value="price-asc">Sort: Price (Low to High)</option>
          <option value="area-desc">Sort: Area (Largest First)</option>
          <option value="area-asc">Sort: Area (Smallest First)</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-display font-bold uppercase tracking-wider text-gray-400">
              <th className="py-3 px-3">Lot ID</th>
              <th className="py-3 px-3">Site &amp; Location</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Area</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {adminListings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-xs text-gray-500 py-8">No listings match your current filter.</td>
              </tr>
            ) : (
              adminListings.map((prop) => (
                <tr key={prop.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-display font-bold px-2.5 py-1 rounded-full bg-black text-white">{prop.lotId}</span>
                    <span className="block text-[10px] text-gray-400 mt-1">{prop.postedOn}</span>
                  </td>
                  <td className="py-3.5 px-3 min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <img src={prop.image} alt={prop.title} className="w-10 h-10 rounded-xl object-cover shrink-0 bg-gray-100" />
                      <div className="min-w-0">
                        <p className="font-display font-bold text-[13.5px] text-black truncate">{prop.title}</p>
                        <p className="text-[11px] text-[#7A7A7A] truncate">{prop.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-[12px] font-medium text-gray-700">{prop.propertyTypeLabel}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-display font-bold text-[12.5px] text-black">{prop.area}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="font-display font-extrabold text-[13px] text-black block">{prop.price}</span>
                    <span className="text-[10.5px] text-[#7A7A7A]">{prop.pricePerSqFt}/sq ft</span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-[12px] text-gray-700">{prop.phone || "—"}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => openPropertyDetail(prop.id)} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-black text-[11.5px] font-semibold text-black transition-colors">View</button>
                      <button onClick={() => setEditingListing(prop)} aria-label="Edit Listing" className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-forest-900 hover:text-forest-900 inline-flex items-center justify-center text-gray-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteListing(prop.id)} aria-label="Delete Listing" className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-red-500 hover:text-red-600 inline-flex items-center justify-center text-gray-500 transition-colors">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingListing && <EditModal listing={editingListing} onClose={() => setEditingListing(null)} />}
    </div>
  );
}

function InlineAddForm() {
  const { nextLotId, switchAdminTab, loadListings } = useWarehub();

  async function handleAdminSubmit(payload: ListingWizardSubmitPayload) {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing: {
          id: Date.now(),
          lotId: payload.lotId,
          postedOn: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          title: payload.title,
          location: payload.location,
          price: payload.priceLabel,
          numericPrice: payload.numericPrice,
          pricePerSqFt: payload.pricePerSqFt,
          negotiable: payload.negotiable,
          category: payload.categoryKey,
          propertyTypeLabel: payload.categoryKey === "Land" ? "Land / Plot" : "Warehouse / Shed",
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
    await loadListings(true);
    return { lotId: data.listing.lotId };
  }

  return (
    <NewListing
      fixedLotId={nextLotId}
      submitLabel="Publish Listing"
      successHeading="Admin listing saved."
      successDescription="The listing has been added to warehub_listings. Copy the brief or jump back to the listings table."
      primarySuccessLabel="Back to Listings"
      secondarySuccessLabel="Add Another Listing"
      onPrimarySuccess={() => switchAdminTab("listings")}
      onSubmitOverride={handleAdminSubmit}
    />
  );
}

export function Admin() {
  const { isAdmin, logoutAdmin, navigateTo, adminTab, switchAdminTab, listings, showToast } =
    useWarehub();

  function copyStandaloneFormLink() {
    const formUrl = `${window.location.origin}/newlisting`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(formUrl)
        .then(() => showToast("Copied /newlisting form link!"))
        .catch(() => showToast("Link ready: /newlisting"));
      return;
    }
    showToast("Link ready: /newlisting");
  }

  const landCount = listings.filter((p) => p.category === "Land").length;
  const warehouseCount = listings.filter((p) => p.category === "Warehouse").length;
  const dockBtnActive =
    "flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all";
  const dockBtnIdle =
    "flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all";

  return (
    <section className="flex-col flex-1 bg-alabaster px-4 sm:px-6 md:px-8 pt-6 pb-28">
      {!isAdmin ? (
        <LoginGate />
      ) : (
        <div className="max-w-5xl mx-auto w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-[24px] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo("home")}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
                title="Public Showcase"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-extrabold text-[18px] sm:text-[22px] text-black">
                    WAREHUB Admin
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F6F6F6] text-gray-600 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Database Live</span>
                  </span>
                </div>
                <p className="text-[12px] text-[#7A7A7A]">Manage listings, edit, export CSV, or add new entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyStandaloneFormLink}
                className="inline-flex items-center gap-1.5 bg-[#F6F6F6] hover:bg-gray-200 text-black text-[12px] font-semibold px-3.5 py-2 rounded-full transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Copy /newlisting Link</span>
              </button>
              <button
                onClick={logoutAdmin}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-black text-black text-[12px] font-semibold px-3.5 py-2 rounded-full transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            </div>
          </div>

          {adminTab === "listings" && (
            <div className="space-y-4">
              <div className="bg-white rounded-[24px] p-5 shadow-sm flex items-center justify-around">
                <div className="text-center">
                  <span className="font-display font-extrabold text-[22px] text-black block">
                    {listings.length}
                  </span>
                  <span className="text-[11px] text-[#7A7A7A] font-medium">Total Lots</span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="text-center">
                  <span className="font-display font-extrabold text-[22px] text-black block">
                    {landCount}
                  </span>
                  <span className="text-[11px] text-[#7A7A7A] font-medium">Plots</span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="text-center">
                  <span className="font-display font-extrabold text-[22px] text-black block">
                    {warehouseCount}
                  </span>
                  <span className="text-[11px] text-[#7A7A7A] font-medium">Warehouses</span>
                </div>
              </div>
              <ListingsTable />
            </div>
          )}

          {adminTab === "add" && <InlineAddForm />}

          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-max max-w-[92vw]">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-full p-1.5 shadow-dock flex items-center gap-2">
              <button onClick={() => switchAdminTab("listings")} className={adminTab === "listings" ? dockBtnActive : dockBtnIdle}>
                <Table2 className="w-4 h-4" />
                <span>Listings &amp; Export</span>
              </button>
              <button onClick={() => switchAdminTab("add")} className={adminTab === "add" ? dockBtnActive : dockBtnIdle}>
                <CirclePlus className="w-4 h-4" />
                <span>Add Listing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}