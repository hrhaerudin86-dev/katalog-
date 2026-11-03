
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";

const KEY_FAVORIT = "sirkula_favorit";

export default function DaftarFavorit({ daftarProduk }) {
  const [idFavorit, setIdFavorit] = useState([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const tersimpan = JSON.parse(
        localStorage.getItem(KEY_FAVORIT) || "[]"
      );

      setIdFavorit(
        Array.isArray(tersimpan) ? tersimpan.map(String) : []
      );
    } catch {
      setIdFavorit([]);
    }

    setSiap(true);
  }, []);

  function hapusFavorit(id) {
    const terbaru = idFavorit.filter(
      (item) => item !== String(id)
    );

    setIdFavorit(terbaru);
    localStorage.setItem(KEY_FAVORIT, JSON.stringify(terbaru));
  }

  const produkFavorit = daftarProduk.filter((produk) =>
    idFavorit.includes(String(produk.id))
  );

  return (
    <section className="py-10">
      <h1 className="mb-6 text-3xl font-extrabold">
        Produk Favorit
      </h1>

      {!siap ? (
        <p className="text-teks-lembut">Memuat produk favorit...</p>
      ) : produkFavorit.length === 0 ? (
        <div className="rounded-xl border border-garis bg-permukaan p-6 text-center">
          <p className="text-teks-lembut">
            Belum ada produk favorit.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block font-semibold text-utama hover:underline"
          >
            Jelajahi produk
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {produkFavorit.map((produk) => {
            const harga =
              produk.harga_diskon &&
              Number(produk.harga_diskon) > 0 &&
              Number(produk.harga_diskon) < Number(produk.harga)
                ? produk.harga_diskon
                : produk.harga;

            return (
              <div
                key={produk.id}
                className="overflow-hidden rounded-2xl border border-garis bg-latar"
              >
                <Link href={`/produk/${produk.id}`}>
                  <img
                    src={produk.foto_url}
                    alt={produk.nama}
                    className="aspect-square w-full bg-permukaan object-cover"
                  />

                  <div className="p-3">
                    <p className="text-xs text-teks-lembut">
                      {produk.kategori}
                    </p>
                    <h2 className="mt-1 font-semibold">
                      {produk.nama}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-harga">
                      {formatRupiah(harga)}
                    </p>
                  </div>
                </Link>

                <div className="p-3 pt-0">
                  <button
                    type="button"
                    onClick={() => hapusFavorit(produk.id)}
                    className="w-full rounded-lg border border-garis px-3 py-2 text-sm font-medium hover:bg-permukaan"
                  >
                    Hapus Favorit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
