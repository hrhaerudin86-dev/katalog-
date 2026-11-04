
"use client";

import { useEffect, useState } from "react";
import KartuProduk from "@/components/KartuProduk";

export default function DaftarTerakhirDilihat({ produk }) {
  const [riwayat, setRiwayat] = useState([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const tersimpan = JSON.parse(
        localStorage.getItem("sirkula_terakhir_dilihat") || "[]"
      );

      setRiwayat(tersimpan.map(String));
    } catch {
      setRiwayat([]);
    }

    setSiap(true);
  }, []);

  const daftarProduk = riwayat
    .map((id) => produk.find((item) => String(item.id) === id))
    .filter(Boolean);

  if (!siap) return null;

  if (daftarProduk.length === 0) {
    return (
      <p className="rounded-xl border border-garis p-6 text-center text-teks-lembut">
        Belum ada produk yang terakhir dilihat.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {daftarProduk.map((item) => (
        <KartuProduk key={item.id} produk={item} />
      ))}
    </div>
  );
}
