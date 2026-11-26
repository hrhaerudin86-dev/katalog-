"use client";

import { useState } from "react";

export default function UploadCoverArtikel({ defaultValue = "" }) {
  const [coverImage, setCoverImage] = useState(defaultValue);
  const [statusText, setStatusText] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setIsError(false);
    setStatusText("Mengunggah gambar cover...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload/article-cover", {
        method: "POST",
        body: fd,
      });

      const hasil = await res.json();
      if (!res.ok || !hasil?.url) {
        throw new Error(hasil?.error || "Gagal upload gambar.");
      }

      setCoverImage(hasil.url);
      setIsError(false);
      setStatusText("Gambar cover berhasil diunggah.");
    } catch (err) {
      setIsError(true);
      setStatusText(err?.message || "Gagal upload gambar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm font-semibold">
      <input type="hidden" name="cover_image" value={coverImage} />
      <label htmlFor="input-cover-artikel">Gambar Cover Artikel (Opsional)</label>
      <input
        id="input-cover-artikel"
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={handleUpload}
        className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-xs font-normal"
      />
      {statusText && (
        <span
          className={`text-xs font-medium ${
            isError ? "text-bahaya" : "text-utama"
          }`}
        >
          {uploading ? "Mengunggah..." : statusText}
        </span>
      )}
      {coverImage && !isError && (
        <img
          src={coverImage}
          alt="Preview cover artikel"
          className="mt-2 max-h-48 w-fit rounded-xl border border-garis object-cover"
        />
      )}
    </div>
  );
}