
"use client";

import { useState } from "react";
import { toko } from "@/lib/toko";
import { formatRupiah } from "@/lib/format";

export default function TombolWhatsApp({ produk }) {
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

  return (
    <div className="flex flex-col gap-4">
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
            onClick={() => setJumlah((nilai) => Math.min(99, nilai + 1))}
            disabled={jumlah >= 99}
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
        className="inline-flex w-full items-center justify-center rounded-lg bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap sm:w-auto"
      >
        Pesan via WhatsApp
      </a>
    </div>
  );
}
