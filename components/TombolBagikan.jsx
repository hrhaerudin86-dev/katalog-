"use client";

import { useState } from "react";

export default function TombolBagikan({ namaProduk }) {
  const [pesan, setPesan] = useState("");

  async function bagikanProduk() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: namaProduk,
          text: `Lihat produk ${namaProduk} di SIRKULA`,
          url,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setPesan("Gagal membagikan link.");
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setPesan("Link tersalin!");
      setTimeout(() => setPesan(""), 2500);
    } catch {
      setPesan("Gagal menyalin link.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={bagikanProduk}
        className="rounded-xl border border-utama px-5 py-2 font-medium text-utama transition hover:bg-utama hover:text-white"
      >
        Bagikan Produk
      </button>

      {pesan && (
        <p className="text-sm font-medium text-utama" role="status">
          {pesan}
        </p>
      )}
    </div>
  );
}