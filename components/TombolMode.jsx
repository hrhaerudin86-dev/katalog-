"use client";

import { useEffect, useState } from "react";

export default function TombolMode() {
  const [modeGelap, setModeGelap] = useState(false);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const temaTersimpan = localStorage.getItem("sirkula_tema");
    const aktif = temaTersimpan === "gelap";

    setModeGelap(aktif);
    document.documentElement.classList.toggle("dark", aktif);
    setSiap(true);
  }, []);

  function gantiMode() {
    const modeBaru = !modeGelap;

    setModeGelap(modeBaru);
    document.documentElement.classList.toggle("dark", modeBaru);
    localStorage.setItem("sirkula_tema", modeBaru ? "gelap" : "terang");
  }

  if (!siap) return null;

  return (
    <button
      type="button"
      onClick={gantiMode}
      className="rounded-xl border border-garis px-4 py-2 font-semibold text-utama transition hover:bg-permukaan"
      aria-label={modeGelap ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
    >
      {modeGelap ? "☀️ Terang" : "🌙 Gelap"}
    </button>
  );
}