"use client";

import { useState } from "react";

export default function GaleriProduk({
  fotoUtama,
  fotoGaleri,
  namaProduk,
}) {
  const daftarFoto = [
    ...new Set(
      [fotoUtama, ...(Array.isArray(fotoGaleri) ? fotoGaleri : [])]
        .filter(
          (foto) =>
            typeof foto === "string" && foto.trim() !== ""
        )
    ),
  ];

  const [fotoAktif, setFotoAktif] = useState(
    daftarFoto[0] || ""
  );

  if (daftarFoto.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-garis bg-permukaan text-teks-lembut">
        Foto belum tersedia
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <img
        src={fotoAktif}
        alt={namaProduk}
        className="aspect-square w-full rounded-2xl border border-garis bg-permukaan object-cover"
      />

      {daftarFoto.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {daftarFoto.map((foto, index) => (
            <button
              key={foto}
              type="button"
              onClick={() => setFotoAktif(foto)}
              aria-label={`Lihat foto ${index + 1}`}
              aria-pressed={fotoAktif === foto}
              className={`overflow-hidden rounded-lg border-2 ${
                fotoAktif === foto
                  ? "border-utama"
                  : "border-garis hover:border-utama"
              }`}
            >
              <img
                src={foto}
                alt={`${namaProduk} - foto ${index + 1}`}
                className="h-20 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}