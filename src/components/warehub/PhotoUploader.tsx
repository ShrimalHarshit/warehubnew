"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { useWarehub } from "./store";
import { fileToCompressedBase64 } from "./utils";

type Props = {
  /** Lot the photo belongs to — stored in warehub_images.lot_id. */
  lotId: string;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
};

const DEFAULT_CLASS =
  "bg-[#F6F6F6] hover:bg-gray-200 text-black text-[11.5px] font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-60";

export function PhotoUploader({ lotId, onUploaded, label = "Upload Photo", className }: Props) {
  const { showToast } = useWarehub();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please pick an image file");
      return;
    }
    setBusy(true);
    try {
      const { dataB64, mime } = await fileToCompressedBase64(file);
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId, mime, dataB64, position: 0 }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      onUploaded(data.url);
      showToast(`Saved to warehub_images (${lotId})`);
    } catch (error) {
      showToast(`Upload failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={className || DEFAULT_CLASS}
      >
        <Upload className="w-3.5 h-3.5" />
        <span>{busy ? "Uploading..." : label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        aria-label="Upload site photo"
      />
    </>
  );
}
