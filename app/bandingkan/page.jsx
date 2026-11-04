
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HalamanBandingkan({ searchParams }) {
  const params = await searchParams;
  const ids = (params.ids || "")
    .split(",")
    .filter(Boolean);

  if (ids.length !== 2 || ids[0] === ids[1]) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  const { data: produk, error } = await supabase
    .from("produk")
    .select(
      "id, nama, kategori, harga, harga_diskon, badge, stok, deskripsi, foto_url, aktif"
    )
    .in("id", ids)
    .eq("aktif", true);

  if (error) {
    throw new Error("Gagal mengambil data perbandingan produk.");
  }

  if (!produk || produk.length !== 2) {
    notFound();
  }

  const daftarProduk = ids.map((id) =>
    produk.find((item) => String(item.id) === String(id))
  );

  function hargaAkhir(item) {
    const normal = Number(item.harga);
    const diskon = Number(item.harga_diskon);

    return diskon > 0 && diskon < normal ? diskon : normal;
  }

  function formatStok(stok) {
    return Number(stok) > 0 ? `Tersedia (${stok})` : "Habis";
  }

  const barisPerbandingan = [
    {
      label: "Kategori",
      nilai: (item) => item.kategori || "-",
    },
    {
      label: "Harga normal",
      nilai: (item) => formatRupiah(item.harga),
    },
    {
      label: "Harga diskon",
      nilai: (item) =>
        Number(item.harga_diskon) > 0 &&
        Number(item.harga_diskon) < Number(item.harga)
          ? formatRupiah(item.harga_diskon)
          : "-",
    },
    {
      label: "Harga saat ini",
      nilai: (item) => formatRupiah(hargaAkhir(item)),
    },
    {
      label: "Badge",
      nilai: (item) => item.badge || "-",
    },
    {
      label: "Stok",
      nilai: (item) => formatStok(item.stok),
    },
    {
      label: "Deskripsi",
      nilai: (item) => item.deskripsi || "-",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            Perbandingan Produk
          </h1>
          <p className="mt-2 text-sm text-teks-lembut">
            Bandingkan spesifikasi dan harga dua produk pilihanmu.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-garis px-4 py-2 text-sm font-semibold hover:bg-latar"
        >
          Kembali ke Katalog
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {daftarProduk.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-garis bg-latar"
          >
            <img
              src={item.foto_url}
              alt={item.nama}
              className="aspect-square w-full object-cover"
            />
            <div className="p-3">
              <h2 className="font-bold leading-snug">
                {item.nama}
              </h2>
              <p className="mt-2 text-sm font-bold text-harga">
                {formatRupiah(hargaAkhir(item))}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-garis">
        {barisPerbandingan.map((baris) => (
          <div
            key={baris.label}
            className="border-b border-garis last:border-b-0"
          >
            <div className="bg-permukaan px-4 py-3 text-sm font-bold">
              {baris.label}
            </div>

            <div className="grid grid-cols-2 divide-x divide-garis">
              {daftarProduk.map((item) => (
                <div
                  key={item.id}
                  className="break-words p-4 text-sm leading-relaxed"
                >
                  {baris.nilai(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/"
          className="rounded-xl bg-utama px-6 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Pilih Produk Lain
        </Link>
      </div>
    </main>
  );
}
