"use client";

import { useEffect } from "react";

export default function CatatProdukDilihat({ produkId }) {
  useEffect(() => {
    if (!produkId) return;

    const kunci = "sirkula_terakhir_dilihat";

    try {
      const riwayatLama = JSON.parse(
        localStorage.getItem(kunci) || "[]"
      );

      const riwayatBaru = [
        String(produkId),
        ...riwayatLama.filter(
          (id) => String(id) !== String(produkId)
        ),
      ].slice(0, 10);

      localStorage.setItem(
        kunci,
        JSON.stringify(riwayatBaru)
      );
    } catch (error) {
      console.error("Gagal menyimpan riwayat produk:", error);
    }
  }, [produkId]);

  return null;
}