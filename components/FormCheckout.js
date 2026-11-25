"use client";

import { useState } from "react";
import Link from "next/link";
import { useKeranjang } from "@/components/KeranjangProvider";

const OPSI_KURIR = [
  { id: "JNE Reguler", nama: "JNE Reguler (Estimasi 2-3 hari)", ongkir: 15000 },
  { id: "J&T Express", nama: "J&T Express (Estimasi 2-3 hari)", ongkir: 16000 },
  { id: "Ambil Sendiri", nama: "Ambil di Lokasi Penjual (Pickup)", ongkir: 0 },
];

export default function FormCheckout({ profilAwal, buatPesananAction }) {
  const { items, siap, hapusItem } = useKeranjang();
  const [kurir, setKurir] = useState(OPSI_KURIR[0]);
  const [metodeBayar, setMetodeBayar] = useState("QRIS");

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

  const subtotal = items.reduce(
    (sum, item) => sum + hargaItem(item) * Number(item.jumlah || 1),
    0
  );
  const total = subtotal + kurir.ongkir;

  if (!siap) {
    return <p className="py-8 text-sm text-teks-lembut">Memuat ringkasan keranjang...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-garis bg-permukaan p-6 text-center">
        <p className="font-bold">Keranjang belanja Anda masih kosong.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-utama px-5 py-2.5 text-sm font-bold text-white">
          Jelajahi Marketplace
        </Link>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        const ids = items.map((it) => it.id);
        ids.forEach((id) => hapusItem(id));
        await buatPesananAction(formData);
      }}
      className="grid gap-6 lg:grid-cols-3"
    >
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
      <input type="hidden" name="courier_name" value={kurir.id} />
      <input type="hidden" name="shipping_cost" value={kurir.ongkir} />
      <input type="hidden" name="payment_method" value={metodeBayar} />

      {/* Kolom Kiri: Alamat, Kurir, Pembayaran */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6">
          <h2 className="text-lg font-bold">1. Alamat & Kontak Pengiriman</h2>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nama Penerima *
            <input
              name="full_name"
              required
              defaultValue={profilAwal?.full_name || ""}
              placeholder="Nama lengkap penerima"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nomor WhatsApp Aktif *
            <input
              name="phone"
              type="tel"
              required
              pattern="[0-9+\-\s]{10,16}"
              defaultValue={profilAwal?.phone || ""}
              placeholder="Contoh: 081234567890 atau 6281234567890"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
            <span className="text-xs font-normal text-teks-lembut">
              Digunakan kurir & penjual untuk konfirmasi pengiriman pesanan.
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Kota / Kabupaten *
            <input
              name="city"
              required
              defaultValue={profilAwal?.city || ""}
              placeholder="Contoh: Kab. Subang"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Alamat Lengkap *
            <textarea
              name="address"
              required
              rows={3}
              defaultValue={profilAwal?.address || ""}
              placeholder="Jalan, RT/RW, Desa/Kelurahan, Kecamatan, Patokan"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-garis bg-latar p-6">
          <h2 className="text-lg font-bold">2. Pilihan Pengiriman</h2>
          {OPSI_KURIR.map((opsi) => (
            <label
              key={opsi.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm ${
                kurir.id === opsi.id ? "border-utama bg-permukaan font-semibold" : "border-garis"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pilihan_kurir"
                  checked={kurir.id === opsi.id}
                  onChange={() => setKurir(opsi)}
                />
                {opsi.nama}
              </span>
              <span>Rp {opsi.ongkir.toLocaleString("id-ID")}</span>
            </label>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-garis bg-latar p-6">
          <h2 className="text-lg font-bold">3. Metode Pembayaran</h2>
          {["QRIS", "EWALLET", "COD"].map((metode) => (
            <label
              key={metode}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${
                metodeBayar === metode ? "border-utama bg-permukaan font-semibold" : "border-garis"
              }`}
            >
              <input
                type="radio"
                name="pilihan_bayar"
                checked={metodeBayar === metode}
                onChange={() => setMetodeBayar(metode)}
              />
              {metode === "QRIS" && "QRIS (Scan semua e-wallet & m-banking)"}
              {metode === "EWALLET" && "E-Wallet (GoPay / OVO / DANA / ShopeePay)"}
              {metode === "COD" && "COD (Bayar di Tempat — khusus wilayah terjangkau)"}
            </label>
          ))}
        </section>
      </div>

      {/* Kolom Kanan: Ringkasan Pesanan */}
      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-garis bg-permukaan p-6">
        <h2 className="text-lg font-bold">Ringkasan Pesanan</h2>
        <div className="flex flex-col gap-2 border-b border-garis pb-4 text-sm">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-teks-lembut">
                {item.nama} × {item.jumlah}
              </span>
              <span className="shrink-0 font-semibold">
                Rp {(hargaItem(item) * Number(item.jumlah || 1)).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-teks-lembut">Subtotal Produk</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-teks-lembut">Ongkos Kirim</span>
            <span>Rp {kurir.ongkir.toLocaleString("id-ID")}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-garis pt-3 text-base font-extrabold">
            <span>Total Bayar</span>
            <span className="text-utama">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Buat Pesanan Sekarang
        </button>
      </aside>
    </form>
  );
}