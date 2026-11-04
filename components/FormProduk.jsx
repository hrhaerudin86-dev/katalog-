
"use client";

import { useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { generateDeskripsiAI } from "@/app/admin/produk/baru/actions";

export default function FormProduk({
  produk = {},
  labelTombol,
  action,
  daftarKategori = [],
}) {
  const [nama, setNama] = useState(produk.nama || "");
  const [kategori, setKategori] = useState(produk.kategori || "");
  const [deskripsi, setDeskripsi] = useState(produk.deskripsi || "");
  const [fotoGaleri, setFotoGaleri] = useState(
    Array.isArray(produk.foto_galeri)
      ? produk.foto_galeri.join("\n")
      : ""
  );
  const [memuatAI, setMemuatAI] = useState(false);
  const [pesanAI, setPesanAI] = useState("");
  const [fotoUtamaDipilih, setFotoUtamaDipilih] = useState(false);
  const [fotoGaleriDipilih, setFotoGaleriDipilih] = useState(false);

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
    } catch {
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
        label="Harga normal (Rp)"
        name="harga"
        type="number"
        min="0"
        defaultValue={produk.harga}
        required
      />

      <Input
        label="Harga diskon (Rp)"
        name="harga_diskon"
        type="number"
        min="0"
        defaultValue={produk.harga_diskon ?? ""}
        placeholder="Kosongkan jika tidak ada diskon"
      />

      <p className="text-xs text-teks-lembut">
        Isi harga diskon jika produk sedang promo. Harga normal akan
        ditampilkan sebagai harga coret.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="badge" className="text-sm font-medium">
          Badge produk
        </label>
        <select
          id="badge"
          name="badge"
          defaultValue={produk.badge || ""}
          className="w-full rounded-lg border border-garis bg-latar px-4 py-3"
        >
          <option value="">Tidak ada badge</option>
          <option value="Baru">Baru</option>
          <option value="Terlaris">Terlaris</option>
        </select>
      </div>

      <Input
        label="Jumlah Stok"
        name="stok"
        type="number"
        min="0"
        step="1"
        defaultValue={produk.stok ?? 1}
        required
      />

      <p className="text-xs text-teks-lembut">
        Masukkan jumlah stok produk. Jika stok 0, produk akan dianggap habis.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="kategori" className="text-sm font-medium">
          Kategori
        </label>

        <select
          id="kategori"
          name="kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          required
          className="w-full rounded-lg border border-garis bg-latar px-4 py-3"
        >
          <option value="">Pilih kategori produk</option>

          {daftarKategori.map((item) => (
            <option key={item.id} value={item.nama}>
              {item.nama}
            </option>
          ))}
        </select>

        {daftarKategori.length === 0 && (
          <p className="text-xs text-red-600">
            Belum ada kategori. Tambahkan kategori terlebih dahulu.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="foto_utama" className="text-sm font-medium">
          Upload foto utama
        </label>
        <input
          id="foto_utama"
          name="foto_utama"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFotoUtamaDipilih(Boolean(e.target.files?.length));
          }}
          className="w-full rounded-lg border border-garis bg-latar p-3 text-sm"
        />
        <p className="text-xs text-teks-lembut">
          Format JPG, PNG, WebP. Maksimal 5 MB.
        </p>
      </div>

      <Input
        label="Atau link foto utama"
        name="foto_url"
        placeholder="https://..."
        defaultValue={produk.foto_url}
        disabled={fotoUtamaDipilih}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="foto_galeri_file" className="text-sm font-medium">
          Upload foto galeri
        </label>
        <input
          id="foto_galeri_file"
          name="foto_galeri_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            setFotoGaleriDipilih(Boolean(e.target.files?.length));
          }}
          className="w-full rounded-lg border border-garis bg-latar p-3 text-sm"
        />
        <p className="text-xs text-teks-lembut">
          Pilih maksimal 10 foto sekaligus. Setiap foto maksimal 5 MB.
        </p>
      </div>

      <Input
        label="Atau link foto galeri (maksimal 10 URL)"
        name="foto_galeri"
        textarea
        value={fotoGaleri}
        onChange={(e) => setFotoGaleri(e.target.value)}
        placeholder={"Masukkan satu URL per baris:\nhttps://contoh.com/foto1.jpg\nhttps://contoh.com/foto2.jpg"}
        disabled={fotoGaleriDipilih}
      />

      <p className="text-xs text-teks-lembut">
        Gunakan upload file atau link URL untuk masing-masing bagian foto,
        jangan keduanya sekaligus.
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={buatDeskripsi}
          disabled={memuatAI}
          className="w-fit rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memuatAI
            ? "Sedang membuat deskripsi..."
            : "✨ Buat Deskripsi dengan AI"}
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
        <Tombol href="/admin" varian="garis">
          Batal
        </Tombol>
      </div>
    </form>
  );
}
