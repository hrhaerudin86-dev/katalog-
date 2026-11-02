
"use client";

import { useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { generateDeskripsiAI } from "@/app/admin/produk/baru/actions";

export default function FormProduk({
  produk = {},
  labelTombol,
  action,
}) {
  const [nama, setNama] = useState(produk.nama || "");
  const [kategori, setKategori] = useState(produk.kategori || "");
  const [deskripsi, setDeskripsi] = useState(produk.deskripsi || "");
  const [memuatAI, setMemuatAI] = useState(false);
  const [pesanAI, setPesanAI] = useState("");

  async function buatDeskripsi() {
    if (!nama.trim() || !kategori.trim()) {
      setPesanAI("Isi nama produk dan kategori terlebih dahulu.");
      return;
    }

    setMemuatAI(true);
    setPesanAI("");

    try {
      const hasil = await generateDeskripsiAI(nama, kategori);

      if (!hasil.success) {
        setPesanAI(hasil.error);
        return;
      }

      setDeskripsi(hasil.deskripsi);
      setPesanAI("Deskripsi berhasil dibuat oleh AI.");
    } catch (error) {
      setPesanAI("Gagal menghubungi Gemini. Silakan coba lagi.");
    } finally {
      setMemuatAI(false);
    }
  }

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <Input
        label="Nama produk"
        name="nama"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        required
      />

      <Input
        label="Harga (Rp)"
        name="harga"
        type="number"
        min="0"
        defaultValue={produk.harga}
        required
      />

      <Input
        label="Kategori"
        name="kategori"
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
      />

      <Input
        label="Link foto"
        name="foto_url"
        placeholder="https://... atau /produk/nama-file.svg"
        defaultValue={produk.foto_url}
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={buatDeskripsi}
          disabled={memuatAI}
          className="w-fit rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memuatAI ? "Sedang membuat deskripsi..." : "✨ Buat Deskripsi dengan AI"}
        </button>

        {pesanAI && (
          <p className="text-sm text-teks-lembut" aria-live="polite">
            {pesanAI}
          </p>
        )}

        <Input
          label="Deskripsi"
          name="deskripsi"
          textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Tombol type="submit">{labelTombol}</Tombol>
        <Tombol href="/admin" varian="garis">Batal</Tombol>
      </div>
    </form>
  );
}
