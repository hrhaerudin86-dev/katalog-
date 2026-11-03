
"use client";

import Link from "next/link";
import { useKeranjang } from "@/components/KeranjangProvider";
import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";

export default function HalamanKeranjang() {
  const {
    items,
    siap,
    jumlahItem,
    totalHarga,
    ubahJumlah,
    hapusItem,
  } = useKeranjang();

  function hargaItem(item) {
    const normal = Number(item.harga);
    const diskon = Number(item.harga_diskon);

    return item.harga_diskon !== null &&
      item.harga_diskon !== undefined &&
      diskon > 0 &&
      diskon < normal
      ? diskon
      : normal;
  }

  function checkoutWhatsApp() {
    const daftarPesanan = items
      .map(
        (item, index) =>
          `${index + 1}. ${item.nama}\n   ${item.jumlah} x ${formatRupiah(hargaItem(item))} = ${formatRupiah(hargaItem(item) * item.jumlah)}`
      )
      .join("\n\n");

    const pesan = `Halo ${toko.nama}, saya ingin memesan:\n\n${daftarPesanan}\n\nTotal: ${formatRupiah(totalHarga)}\n\nMohon informasi lebih lanjut. Terima kasih.`;

    const url = `https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!siap) {
    return (
      <div className="py-16 text-center text-teks-lembut">
        Memuat keranjang...
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-3xl font-extrabold">Keranjang Belanja</h1>
        <p className="mt-2 text-teks-lembut">
          Periksa produk dan jumlah pesanan sebelum checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-garis bg-permukaan p-8 text-center">
          <p className="font-semibold">Keranjang masih kosong.</p>
          <p className="mt-2 text-sm text-teks-lembut">
            Silakan pilih produk terlebih dahulu.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-utama px-5 py-3 font-bold text-white"
          >
            Lihat Produk
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-garis bg-latar p-4"
              >
                <img
                  src={item.foto_url}
                  alt={item.nama}
                  className="h-24 w-24 rounded-xl bg-permukaan object-cover"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h2 className="font-bold">{item.nama}</h2>

                  <p className="text-sm font-semibold text-harga">
                    {formatRupiah(hargaItem(item))}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor={`jumlah-${item.id}`}
                      className="text-sm text-teks-lembut"
                    >
                      Jumlah:
                    </label>

                    <input
                      id={`jumlah-${item.id}`}
                      type="number"
                      min="1"
                      max={item.stok}
                      value={item.jumlah}
                      onChange={(e) =>
                        ubahJumlah(item.id, e.target.value)
                      }
                      className="w-20 rounded-lg border border-garis bg-latar px-2 py-1"
                    />

                    <button
                      type="button"
                      onClick={() => hapusItem(item.id)}
                      className="text-sm font-semibold text-red-600 underline"
                    >
                      Hapus
                    </button>
                  </div>

                  <p className="text-sm font-bold">
                    Subtotal:{" "}
                    {formatRupiah(hargaItem(item) * item.jumlah)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-garis bg-permukaan p-5">
            <div className="flex justify-between text-sm text-teks-lembut">
              <span>Total item</span>
              <span>{jumlahItem} produk</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">Total Belanja</span>
              <span className="text-xl font-extrabold text-harga">
                {formatRupiah(totalHarga)}
              </span>
            </div>

            <button
              type="button"
              onClick={checkoutWhatsApp}
              className="mt-5 w-full rounded-xl bg-utama px-5 py-3 font-bold text-white transition hover:opacity-90"
            >
              Pesan Semua via WhatsApp
            </button>

            <Link
              href="/"
              className="mt-4 block text-center text-sm text-teks-lembut underline underline-offset-4"
            >
              Lanjut Belanja
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
