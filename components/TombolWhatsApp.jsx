
"use client";

import { useState } from "react";
import { toko } from "@/lib/toko";
import { formatRupiah } from "@/lib/format";
import { catatKlikWhatsApp } from "@/app/produk/klik-whatsapp";

export default function TombolWhatsApp({ produk }) {
  const stok = Math.max(0, Math.floor(Number(produk.stok ?? 0)));
  const stokHabis = stok <= 0;

  const [jumlah, setJumlah] = useState(1);

  const totalHarga = produk.harga * jumlah;

  const pesan = [
    "Halo, saya mau pesan:",
    `Nama produk: ${produk.nama}`,
    `Harga satuan: ${formatRupiah(produk.harga)}`,
    `Jumlah: ${jumlah}`,
    `Total harga: ${formatRupiah(totalHarga)}`,
  ].join("\n");

  const linkWhatsApp = `https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

  function handleKlikWhatsApp() {
    catatKlikWhatsApp(produk.id).catch((error) => {
      console.error("Pencatatan klik WhatsApp gagal:", error);
    });
  }

  if (stokHabis) {
    return (
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-lg bg-red-100 px-4 py-2 font-bold text-red-700">
          Stok Habis
        </span>
        <p className="text-sm text-teks-lembut">
          Maaf, produk ini sedang tidak tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-teks-lembut">
        Stok tersedia: {stok}
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          Jumlah produk
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setJumlah((nilai) => Math.max(1, nilai - 1))}
            disabled={jumlah <= 1}
            className="h-11 w-11 rounded-lg border border-garis font-bold disabled:opacity-40"
            aria-label="Kurangi jumlah"
          >
            −
          </button>

          <span className="min-w-10 text-center font-bold">
            {jumlah}
          </span>

          <button
            type="button"
            onClick={() => setJumlah((nilai) => Math.min(stok, nilai + 1))}
            disabled={jumlah >= stok}
            className="h-11 w-11 rounded-lg border border-garis font-bold disabled:opacity-40"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-lg font-bold text-harga">
        Total: {formatRupiah(totalHarga)}
      </p>

      <a
        href={linkWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleKlikWhatsApp}
        className="inline-flex w-full items-center justify-center rounded-lg bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap sm:w-auto"
      >
        Pesan via WhatsApp
      </a>
    </div>
  );
}
