"use client";

import { Admin } from "./Admin";
import { Detail } from "./Detail";
import { NewListing } from "./NewListing";
import { Showcase } from "./Showcase";
import { useWarehub } from "./store";

export function WarehubApp() {
  const { screen, toastMessage, selected } = useWarehub();
  const activeScreen = screen === "detail" && !selected ? "home" : screen;

  return (
    <div
      id="app-shell"
      className="w-full max-w-6xl mx-auto min-h-screen bg-alabaster relative flex flex-col"
    >
      {/* Toast Notification Banner */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 transform w-max max-w-[92vw] ${
          toastMessage ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="bg-forest-900 text-white text-xs font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-limepop shrink-0" />
          <span>{toastMessage || "Updated"}</span>
        </div>
      </div>

      {activeScreen === "home" && (
        <div key="home" className="app-screen active flex-col flex-1 relative pb-12">
          <Showcase />
        </div>
      )}

      {activeScreen === "detail" && (
        <div
          key="detail"
          className="app-screen active flex-col flex-1 relative bg-alabaster overflow-y-auto pb-12"
        >
          <Detail />
        </div>
      )}

      {activeScreen === "add" && (
        <div key="add" className="app-screen active flex-col flex-1 bg-alabaster">
          <NewListing />
        </div>
      )}

      {activeScreen === "admin" && (
        <div key="admin" className="app-screen active flex-col flex-1">
          <Admin />
        </div>
      )}
    </div>
  );
}

export default WarehubApp;
