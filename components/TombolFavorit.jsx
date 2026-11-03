
"use client";

import { useEffect, useState } from "react";

const KEY_FAVORIT = "sirkula_favorit";

export default function TombolFavorit({ produkId }) {
  const [favorit, setFavorit] = useState(false);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const tersimpan = JSON.parse(
      localStorage.getItem(KEY_FAVORIT) || "[]"
    );

    setFavorit(tersimpan.includes(String(produkId)));
    setSiap(true);
  }, [produkId]);

  function toggleFavorit(e) {
    e.preventDefault();
    e.stopPropagation();

    const tersimpan = JSON.parse(
      localStorage.getItem(KEY_FAVORIT) || "[]"
    );

    let terbaru;

    if (tersimpan.includes(String(produkId))) {
      terbaru = tersimpan.filter(
        (id) => id !== String(produkId)
      );
      setFavorit(false);
    } else {
      terbaru = [...tersimpan, String(produkId)];
      setFavorit(true);
    }

    localStorage.setItem(KEY_FAVORIT, JSON.stringify(terbaru));
  }

  if (!siap) return null;

  return (
    <button
      type="button"
      onClick={toggleFavorit}
      aria-label={favorit ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={favorit}
      className={`absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 ${
        favorit ? "text-red-600" : "text-gray-500"
      }`}
    >
      {favorit ? "♥" : "♡"}
    </button>
  );
}
