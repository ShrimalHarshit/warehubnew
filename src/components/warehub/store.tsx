"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  AdminSort,
  AdminTab,
  Category,
  Listing,
  NeonStatus,
  Screen,
  ShowcaseSort,
} from "./types";
import {
  downloadBlob,
  formatIndianPriceDisplay,
  generateNextLotId,
  parseNumericArea,
  parseRupeeAmount,
  todayFormatted,
} from "./utils";

export const NEON_STORAGE_KEY = "warehub_neon_connection_uri";

function screenFromPath(path: string): Screen {
  if (path.startsWith("/newlisting")) return "add";
  if (path.startsWith("/admin")) return "admin";
  return "home";
}

export type NewListingInput = {
  type: Category;
  title: string;
  location: string;
  rawArea: string;
  rawPrice: string;
  phone: string;
  description: string;
  image: string;
  ownership: string;
  possession: string;
  use: string;
  lotId?: string;
};

type WarehubContextValue = {
  // routing
  screen: Screen;
  navigateTo: (screen: Screen, updateUrl?: boolean) => void;

  // listings
  listings: Listing[];
  isLoading: boolean;
  syncError: string;
  visibleListings: Listing[];
  nextLotId: string;
  selected: Listing | null;
  loadListings: (silent?: boolean) => Promise<void>;
  addListing: (input: NewListingInput) => Promise<Listing>;
  updateListing: (id: number, fields: Partial<Listing>) => Promise<Listing>;
  deleteListing: (id: number) => Promise<void>;

  // showcase controls
  category: Category | "All";
  setCategory: (c: Category | "All") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
  showcaseSort: ShowcaseSort;
  applySort: (mode: ShowcaseSort) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  openPropertyDetail: (id: number) => void;

  // standalone form
  newPropType: Category;
  selectNewType: (t: Category) => void;
  previewIndex: number;
  cyclePreviewImage: () => void;

  // admin auth + tabs
  isAdmin: boolean;
  handleAdminLogin: (id: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => void;
  adminTab: AdminTab;
  switchAdminTab: (tab: AdminTab) => void;
  adminInlineType: Category;
  setAdminInlineType: (t: Category) => void;

  // admin table
  adminSearch: string;
  setAdminSearch: (v: string) => void;
  adminTypeFilter: string;
  setAdminTypeFilter: (v: string) => void;
  adminSort: AdminSort;
  setAdminSort: (v: AdminSort) => void;
  adminListings: Listing[];
  exportCSV: () => void;
  exportJSON: () => void;

  // toast
  toastMessage: string;
  showToast: (msg: string) => void;
};

const WarehubContext = createContext<WarehubContextValue | null>(null);

export function useWarehub(): WarehubContextValue {
  const ctx = useContext(WarehubContext);
  if (!ctx) throw new Error("useWarehub must be used inside WarehubProvider");
  return ctx;
}

export function WarehubProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const [screen, setScreenState] = useState<Screen>(() => screenFromPath(pathname));
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState("");

  const [category, setCategoryState] = useState<Category | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showcaseSort, setShowcaseSort] = useState<ShowcaseSort>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [newPropType, setNewPropType] = useState<Category>("Land");
  const [previewIndex, setPreviewIndex] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("listings");
  const [adminInlineType, setAdminInlineType] = useState<Category>("Land");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState("All");
  const [adminSort, setAdminSort] = useState<AdminSort>("newest");

  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 2500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* ------------------------------------------------------------------ data */

  const loadListings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/listings", { cache: "no-store" });
      const data = (await res.json()) as { listings?: Listing[]; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setListings(Array.isArray(data.listings) ? data.listings : []);
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to load SQL database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addListing = useCallback(
    async (input: NewListingInput) => {
      const numericArea = parseNumericArea(input.rawArea);
      const numericPrice = parseRupeeAmount(input.rawPrice);
      const formattedArea =
        numericArea > 0 ? `${numericArea.toLocaleString("en-IN")} sq ft` : input.rawArea;
      const formattedPrice =
        numericPrice > 0
          ? formatIndianPriceDisplay(input.rawPrice, numericPrice)
          : input.rawPrice.startsWith("₹")
            ? input.rawPrice
            : `₹${input.rawPrice}`;
      const calculatedPpsf =
        numericArea > 0 && numericPrice > 0
          ? `₹${Math.round(numericPrice / numericArea).toLocaleString("en-IN")}`
          : "₹417";

      const payload = {
        id: Date.now(),
        lotId: input.lotId || generateNextLotId(listings),
        postedOn: todayFormatted(),
        title: input.title,
        location: input.location,
        price: formattedPrice,
        numericPrice,
        pricePerSqFt: calculatedPpsf,
        negotiable: "Negotiable",
        category: input.type,
        propertyTypeLabel: input.type === "Land" ? "Land / Plot" : "Warehouse / Shed",
        area: formattedArea,
        numericArea,
        ownership: input.ownership,
        possession: input.possession,
        use: input.use,
        phone: input.phone,
        description: input.description,
        image: input.image,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: payload }),
      });
      const data = (await res.json()) as { listing?: Listing; error?: string };
      if (!res.ok || !data.listing) throw new Error(data.error || "Failed to save listing");
      setListings((prev) => [...prev, data.listing as Listing]);
      return data.listing;
    },
    [listings],
  );

  const updateListing = useCallback(
    async (id: number, fields: Partial<Listing>) => {
      const res = await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: { ...fields, id } }),
      });
      const data = (await res.json()) as { listing?: Listing; error?: string };
      if (!res.ok || !data.listing) throw new Error(data.error || "Update failed");
      setListings((prev) =>
        prev.map((p) => (p.id === id ? (data.listing as Listing) : p)),
      );
      showToast(`Updated ${data.listing.lotId}`);
      return data.listing;
    },
    [showToast],
  );

  const deleteListing = useCallback(async (id: number) => {
    const target = listings.find((p) => p.id === id);
    try {
      const res = await fetch(`/api/listings?id=${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setListings((prev) => prev.filter((p) => p.id !== id));
      showToast(`Deleted ${target?.lotId ?? "listing"} from SQL`);
    } catch (error) {
      showToast(
        `SQL Delete Error: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }, [listings, showToast]);

  /* --------------------------------------------------------------- routing */

  const navigateTo = useCallback(
    (target: Screen, updateUrl = true) => {
      if (target === "detail") {
        setScreenState("detail");
        return;
      }
      const path = target === "add" ? "/newlisting" : target === "admin" ? "/admin" : "/";
      setScreenState(target);
      if (updateUrl && pathname !== path) {
        router.push(path);
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    const target = screenFromPath(pathname);
    setScreenState((prev) => (prev === "detail" && target === "home" ? "detail" : target));
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [screen]);

  /* ------------------------------------------------------------- selectors */

  useEffect(() => {
    void loadListings(false);
  }, [loadListings]);

  const visibleListings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = listings.filter((prop) => {
      const matchesCategory = category === "All" || prop.category === category;
      const matchesQuery =
        !q ||
        prop.title.toLowerCase().includes(q) ||
        prop.location.toLowerCase().includes(q) ||
        prop.lotId.toLowerCase().includes(q) ||
        prop.area.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    if (showcaseSort === "price-asc") {
      filtered.sort(
        (a, b) =>
          (a.numericPrice || parseRupeeAmount(a.price)) -
          (b.numericPrice || parseRupeeAmount(b.price)),
      );
    } else {
      filtered.sort((a, b) => b.id - a.id);
    }
    return filtered;
  }, [listings, category, searchQuery, showcaseSort]);

  const adminListings = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();
    const list = listings.filter((prop) => {
      const matchesCat = adminTypeFilter === "All" || prop.category === adminTypeFilter;
      const matchesQuery =
        !query ||
        prop.lotId.toLowerCase().includes(query) ||
        prop.title.toLowerCase().includes(query) ||
        prop.location.toLowerCase().includes(query) ||
        (prop.phone || "").toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
    list.sort((a, b) => {
      const priceA = a.numericPrice || parseRupeeAmount(a.price);
      const priceB = b.numericPrice || parseRupeeAmount(b.price);
      const areaA = a.numericArea || parseNumericArea(a.area);
      const areaB = b.numericArea || parseNumericArea(b.area);
      if (adminSort === "oldest") return a.id - b.id;
      if (adminSort === "price-desc") return priceB - priceA;
      if (adminSort === "price-asc") return priceA - priceB;
      if (adminSort === "area-desc") return areaB - areaA;
      if (adminSort === "area-asc") return areaA - areaB;
      return b.id - a.id;
    });
    return list;
  }, [listings, adminSearch, adminTypeFilter, adminSort]);

  const selected = useMemo(
    () => listings.find((p) => p.id === selectedId) ?? null,
    [listings, selectedId],
  );

  const nextLotId = useMemo(() => generateNextLotId(listings), [listings]);

  /* --------------------------------------------------------------- actions */

  const setCategory = useCallback((c: Category | "All") => setCategoryState(c), []);

  const resetFilters = useCallback(() => {
    setCategoryState("All");
    setSearchQuery("");
    setShowcaseSort("newest");
  }, []);

  const applySort = useCallback(
    (mode: ShowcaseSort) => {
      setShowcaseSort(mode);
      setFilterOpen(false);
      showToast(mode === "price-asc" ? "Sorted by lowest price" : "Sorted by newest listings");
    },
    [showToast],
  );

  const openPropertyDetail = useCallback((id: number) => {
    setSelectedId(id);
    setScreenState("detail");
  }, []);

  const selectNewType = useCallback((t: Category) => {
    setNewPropType(t);
    setPreviewIndex(t === "Land" ? 0 : 1);
  }, []);

  const cyclePreviewImage = useCallback(() => {
    setPreviewIndex((prev) => (prev + 1) % 4);
  }, []);

  const handleAdminLogin = useCallback(
    async (id: string, pass: string) => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, pass }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setIsAdmin(true);
          showToast("Admin access granted");
          return true;
        }
      } catch {
        // Fallback or network error
      }
      return false;
    },
    [showToast],
  );

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    setAdminTab("listings");
    showToast("Admin locked");
  }, [showToast]);

  const switchAdminTab = useCallback(
    (tab: AdminTab) => {
      setAdminTab(tab);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    },
    [],
  );

  const exportCSV = useCallback(() => {
    if (adminListings.length === 0) {
      showToast("No listings to export");
      return;
    }
    const headers = [
      "Lot ID",
      "Posted On",
      "Category",
      "Property Type",
      "Title",
      "Location",
      "Area",
      "Asking Price",
      "Price Per Sq Ft",
      "Phone Number",
      "Ownership",
      "Possession",
      "Permitted Use",
      "Description",
    ];
    const escapeCSV = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const rows = adminListings.map((p) =>
      [
        p.lotId,
        p.postedOn,
        p.category,
        p.propertyTypeLabel,
        p.title,
        p.location,
        p.area,
        p.price,
        p.pricePerSqFt,
        p.phone,
        p.ownership,
        p.possession,
        p.use,
        p.description,
      ]
        .map(escapeCSV)
        .join(","),
    );
    downloadBlob(
      [headers.join(","), ...rows].join("\n"),
      `WAREHUB_Listings_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    showToast(`Downloaded ${adminListings.length} listings (CSV)`);
  }, [adminListings, showToast]);

  const exportJSON = useCallback(() => {
    if (adminListings.length === 0) {
      showToast("No listings to export");
      return;
    }
    downloadBlob(
      JSON.stringify(adminListings, null, 2),
      `WAREHUB_Listings_${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
    showToast(`Exported ${adminListings.length} listings (JSON)`);
  }, [adminListings, showToast]);

  const value: WarehubContextValue = {
    screen,
    navigateTo,
    listings,
    isLoading,
    syncError,
    visibleListings,
    nextLotId,
    selected,
    loadListings,
    addListing,
    updateListing,
    deleteListing,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    resetFilters,
    showcaseSort,
    applySort,
    filterOpen,
    setFilterOpen,
    openPropertyDetail,
    newPropType,
    selectNewType,
    previewIndex,
    cyclePreviewImage,
    isAdmin,
    handleAdminLogin,
    logoutAdmin,
    adminTab,
    switchAdminTab,
    adminInlineType,
    setAdminInlineType,
    adminSearch,
    setAdminSearch,
    adminTypeFilter,
    setAdminTypeFilter,
    adminSort,
    setAdminSort,
    adminListings,
    exportCSV,
    exportJSON,
    toastMessage,
    showToast,
  };

  return <WarehubContext.Provider value={value}>{children}</WarehubContext.Provider>;
}
