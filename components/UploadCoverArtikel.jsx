"use client";

import { useState } from "react";

export default function UploadCoverArtikel() {
  const [coverImage, setCoverImage] = useState("");
  const [statusText, setStatusText] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
      setStatusText("Gambar cover berhasil diunggah.");
    } catch (err) {
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
        onChange={handleUpload}
        className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-xs font-normal"
      />
      {statusText && (
        <span className="text-xs font-medium text-utama">
          {uploading ? "Mengunggah..." : statusText}
        </span>
      )}
      {coverImage && (
        <img
          src={coverImage}
          alt="Preview cover artikel"
          className="mt-2 max-h-48 w-fit rounded-xl border border-garis object-cover"
        />
      )}
    </div>
  );
}