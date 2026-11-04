
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";

const JUMLAH_PER_TAMPILAN = 12;

export default function FilterProduk({ daftarProduk = [] }) {
  const [kataKunci, setKataKunci] = useState("");
  const [kategoriDipilih, setKategoriDipilih] = useState("Semua");
  const [urutan, setUrutan] = useState("terbaru");
  const [jumlahDitampilkan, setJumlahDitampilkan] =
    useState(JUMLAH_PER_TAMPILAN);
  const [produkDipilih, setProdukDipilih] = useState([]);

  const daftarKategori = [
    "Semua",
    ...new Set(
      daftarProduk.map((produk) => produk.kategori).filter(Boolean)
    ),
  ];

  const produkTersaring = useMemo(() => {
    const hasilFilter = daftarProduk.filter((produk) => {
      const cocokNama = (produk.nama || "")
        .toLowerCase()
        .includes(kataKunci.toLowerCase());

      const cocokKategori =
        kategoriDipilih === "Semua" ||
        produk.kategori === kategoriDipilih;

      return cocokNama && cocokKategori;
    });

    return [...hasilFilter].sort((a, b) => {
      switch (urutan) {
        case "terlama":
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case "harga-termurah":
          return Number(a.harga || 0) - Number(b.harga || 0);
        case "harga-termahal":
          return Number(b.harga || 0) - Number(a.harga || 0);
        case "nama-az":
          return (a.nama || "").localeCompare(b.nama || "", "id");
        case "nama-za":
          return (b.nama || "").localeCompare(a.nama || "", "id");
        case "terbaru":
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });
  }, [daftarProduk, kataKunci, kategoriDipilih, urutan]);

  useEffect(() => {
    setJumlahDitampilkan(JUMLAH_PER_TAMPILAN);
  }, [kataKunci, kategoriDipilih, urutan]);

  const produkDitampilkan = produkTersaring.slice(0, jumlahDitampilkan);
  const masihAdaProduk = jumlahDitampilkan < produkTersaring.length;

  function muatLebihBanyak() {
    setJumlahDitampilkan((jumlah) => jumlah + JUMLAH_PER_TAMPILAN);
  }

  function pilihUntukDibandingkan(id) {
    setProdukDipilih((sebelumnya) => {
      if (sebelumnya.includes(id)) {
        return sebelumnya.filter((item) => item !== id);
      }

      if (sebelumnya.length >= 2) {
        return sebelumnya;
      }

      return [...sebelumnya, id];
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          value={kataKunci}
          onChange={(event) => setKataKunci(event.target.value)}
          placeholder="Cari nama produk..."
          aria-label="Cari nama produk"
          className="w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-sm outline-none focus:border-teks"
        />

        <select
          value={kategoriDipilih}
          onChange={(event) => setKategoriDipilih(event.target.value)}
          aria-label="Filter kategori"
          className="w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-sm outline-none focus:border-teks"
        >
          {daftarKategori.map((kategori) => (
            <option key={kategori} value={kategori}>
              {kategori}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-teks-lembut">
          Menampilkan {produkDitampilkan.length} dari {produkTersaring.length} produk
        </p>

        <select
          value={urutan}
          onChange={(event) => setUrutan(event.target.value)}
          aria-label="Urutkan produk"
          className="w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-sm outline-none focus:border-teks sm:w-auto"
        >
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
          <option value="harga-termurah">Harga termurah</option>
          <option value="harga-termahal">Harga termahal</option>
          <option value="nama-az">Nama A–Z</option>
          <option value="nama-za">Nama Z–A</option>
        </select>
      </div>

      {produkTersaring.length === 0 ? (
        <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
          Produk tidak ditemukan. Coba kata kunci atau kategori lain.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {produkDitampilkan.map((produk) => {
              const dipilih = produkDipilih.includes(produk.id);

              return (
                <div key={produk.id} className="flex flex-col gap-2">
                  <KartuProduk produk={produk} />

                  <button
                    type="button"
                    onClick={() => pilihUntukDibandingkan(produk.id)}
                    disabled={!dipilih && produkDipilih.length >= 2}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      dipilih
                        ? "border-utama bg-utama text-white"
                        : "border-garis bg-permukaan hover:border-utama disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    {dipilih ? "✓ Dipilih" : "＋ Bandingkan"}
                  </button>
                </div>
              );
            })}
          </div>

          {masihAdaProduk && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={muatLebihBanyak}
                className="rounded-xl border border-garis bg-permukaan px-6 py-3 text-sm font-semibold transition hover:bg-latar"
              >
                Muat Lebih Banyak
              </button>
            </div>
          )}
        </>
      )}

      {produkDipilih.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-latar p-4 shadow-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div>
              <p className="font-bold">
                {produkDipilih.length} dari 2 produk dipilih
              </p>
              <p className="text-xs text-teks-lembut">
                Pilih dua produk untuk mulai membandingkan.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProdukDipilih([])}
                className="rounded-xl border border-garis px-3 py-2 text-sm font-semibold"
              >
                Reset
              </button>

              <Link
                href={`/bandingkan?ids=${produkDipilih.join(",")}`}
                aria-disabled={produkDipilih.length !== 2}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${
                  produkDipilih.length === 2
                    ? "bg-utama"
                    : "pointer-events-none bg-teks-lembut opacity-50"
                }`}
              >
                Bandingkan
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
