import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { WarehubProvider } from "@/components/warehub/store";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WAREHUB — Plot & Warehouse Listing Platform",
  description:
    "WAREHUB — list and discover industrial plots, land parcels and warehouses across Nashik and Maharashtra.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="bg-alabaster text-ink antialiased selection:bg-limepop selection:text-forest-950 font-sans">
        <WarehubProvider>{children}</WarehubProvider>
      </body>
    </html>
  );
}
