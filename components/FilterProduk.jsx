
"use client";

import { useMemo, useState } from "react";
import KartuProduk from "@/components/KartuProduk";

export default function FilterProduk({ daftarProduk = [] }) {
  const [kataKunci, setKataKunci] = useState("");
  const [kategoriDipilih, setKategoriDipilih] = useState("Semua");

  const daftarKategori = [
    "Semua",
    ...new Set(
      daftarProduk
        .map((produk) => produk.kategori)
        .filter(Boolean)
    ),
  ];

  const produkTersaring = useMemo(() => {
    return daftarProduk.filter((produk) => {
      const cocokNama = produk.nama
        .toLowerCase()
        .includes(kataKunci.toLowerCase());

      const cocokKategori =
        kategoriDipilih === "Semua" ||
        produk.kategori === kategoriDipilih;

      return cocokNama && cocokKategori;
    });
  }, [daftarProduk, kataKunci, kategoriDipilih]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          value={kataKunci}
          onChange={(event) => setKataKunci(event.target.value)}
          placeholder="Cari nama produk..."
          aria-label="Cari nama produk"
          className="w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-sm outline-none focus:border-teks"
        />

        <select
          value={kategoriDipilih}
          onChange={(event) => setKategoriDipilih(event.target.value)}
          aria-label="Filter kategori"
          className="w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-sm outline-none focus:border-teks"
        >
          {daftarKategori.map((kategori) => (
            <option key={kategori} value={kategori}>
              {kategori}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-teks-lembut">
        Menampilkan {produkTersaring.length} dari {daftarProduk.length} produk
      </p>

      {produkTersaring.length === 0 ? (
        <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
          Produk tidak ditemukan. Coba kata kunci atau kategori lain.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {produkTersaring.map((produk) => (
            <KartuProduk key={produk.id} produk={produk} />
          ))}
        </div>
      )}
    </div>
  );
}
