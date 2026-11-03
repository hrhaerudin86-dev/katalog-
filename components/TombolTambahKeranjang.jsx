
"use client";

import { useState } from "react";
import { useKeranjang } from "@/components/KeranjangProvider";

export default function TombolTambahKeranjang({ produk }) {
  const { tambahItem } = useKeranjang();
  const [pesan, setPesan] = useState("");

  const stokHabis = Number(produk.stok ?? 0) <= 0;

  function handleTambah() {
    const berhasil = tambahItem(produk, 1);

    if (!berhasil) {
      setPesan("Stok produk habis.");
      return;
    }

    setPesan("Produk berhasil ditambahkan ke keranjang.");

    setTimeout(() => {
      setPesan("");
    }, 2500);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleTambah}
        disabled={stokHabis}
        className="w-full rounded-xl bg-utama px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {stokHabis ? "Stok Habis" : "Tambah ke Keranjang"}
      </button>

      {pesan && (
        <p className="text-sm text-teks-lembut" role="status">
          {pesan}
        </p>
      )}
    </div>
  );
}
