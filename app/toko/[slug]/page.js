import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HalamanProfilToko({ params }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: toko } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!toko) {
    notFound();
  }

  const { data: produkToko } = await supabase
    .from("produk")
    .select("id, nama, harga, harga_diskon, foto_url, kategori, stok, satuan, kondisi")
    .eq("store_id", toko.id)
    .eq("aktif", true)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8 py-8">
      <Link href="/" className="text-sm text-teks-lembut hover:text-utama">
        ← Kembali ke Beranda
      </Link>

      {/* Header Profil Toko */}
      <section className="rounded-2xl border border-garis bg-permukaan p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{toko.name}</h1>
          {toko.verification_status === "verified" && (
            <span className="rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
              Toko Terverifikasi
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-teks-lembut">Lokasi: {toko.location}</p>
        {toko.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed">{toko.description}</p>
        )}
      </section>

      {/* Daftar Produk Toko */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Produk & Material ({produkToko?.length ?? 0})
        </h2>

        {!produkToko || produkToko.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Toko ini belum memiliki produk aktif.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produkToko.map((p) => (
              <Link
                key={p.id}
                href={`/produk/${p.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-garis bg-latar transition-colors hover:border-utama"
              >
                {p.foto_url && (
                  <img
                    src={p.foto_url}
                    alt={p.nama}
                    className="aspect-square w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-xs text-teks-lembut">{p.kategori}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold">{p.nama}</h3>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-extrabold text-utama">
                      Rp {Number(p.harga_diskon || p.harga).toLocaleString("id-ID")} / {p.satuan || "pcs"}
                    </p>
                    <p className="mt-1 text-xs text-teks-lembut">
                      Stok: {p.stok} • {p.kondisi || "Terpilah"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}