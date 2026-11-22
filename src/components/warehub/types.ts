export type Category = "Land" | "Warehouse";

export type Listing = {
  id: number;
  lotId: string;
  postedOn: string;
  title: string;
  location: string;
  price: string;
  numericPrice: number;
  pricePerSqFt: string;
  negotiable: string;
  category: Category;
  propertyTypeLabel: string;
  area: string;
  numericArea: number;
  ownership: string;
  possession: string;
  use: string;
  phone: string;
  description: string;
  image: string;
};

export type Screen = "home" | "detail" | "add" | "admin";

export type AdminTab = "listings" | "add";

export type ShowcaseSort = "newest" | "price-asc";

export type AdminSort =
  | "newest"
  | "oldest"
  | "price-desc"
  | "price-asc"
  | "area-desc"
  | "area-asc";

export type NeonStatus = "idle" | "connected" | "error";
