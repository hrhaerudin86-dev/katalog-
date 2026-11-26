import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";
import { ambilPengaturanToko } from "@/lib/pengaturan-toko";
import FilterProduk from "@/components/FilterProduk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buatSlug(teks) {
  return (teks || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function HalamanKatalog() {
  let daftarProduk = [];
  let daftarBanner = [];
  let daftarArtikel = [];
  let pesanError = "";

  const pengaturan = await ambilPengaturanToko();

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_diskon, badge, stok, deskripsi, foto_url, kategori, created_at, urutan"
      )
      .eq("aktif", true)
      .order("urutan", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    daftarProduk = data ?? [];

    const { data: banner, error: errorBanner } = await supabase
      .from("banner_promo")
      .select("id, judul, teks, gambar_url, tautan")
      .eq("aktif", true)
      .order("created_at", { ascending: false });

    if (!errorBanner) daftarBanner = banner ?? [];

    const { data: artikel, error: errorArtikel } = await supabase
      .from("articles")
      .select("id, title, slug, topic, excerpt, cover_image, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);

    if (!errorArtikel) daftarArtikel = artikel ?? [];
  } catch (error) {
    console.error("Gagal mengambil data beranda:", error);
    pesanError = "Katalog belum dapat dimuat dari database. Silakan coba lagi nanti.";
  }

  const daftarKategori = [
    ...new Set(
      daftarProduk
        .map((p) => p.kategori)
        .filter((k) => k && k.toLowerCase() !== "uji coba")
    ),
  ].slice(0, 8);

  return (
    <div className="flex flex-col gap-12 pb-12">
      <section className="pt-8 sm:pt-12">
        <span className="inline-block rounded-full border border-garis bg-permukaan px-3 py-1 text-xs font-semibold text-utama">
          Circular Economy Marketplace
        </span>

        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {pengaturan.nama || toko.nama}
        </h1>

        <p className="mt-3 max-w-xl text-lg text-teks-lembut">
          {toko.tagline} — Hubungkan material sisa bernilai guna dengan UMKM, pengrajin, dan industri kreatif.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#marketplace"
            className="rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Jelajahi Marketplace
          </a>
          <Link
            href="/artikel"
            className="rounded-xl border border-garis bg-latar px-5 py-3 text-sm font-semibold transition-colors hover:bg-permukaan"
          >
            Baca Edukasi Sirkular
          </Link>
        </div>

        <p className="mt-4 text-xs text-teks-lembut">
          Operasional: {pengaturan.jamBuka || toko.jamBuka}
        </p>
      </section>

      {daftarBanner.length > 0 && (
        <section aria-label="Promo toko" className="flex flex-col gap-5">
          {daftarBanner.map((banner) => {
            const isiBanner = (
              <div className="overflow-hidden rounded-2xl border border-garis bg-latar">
                {banner.gambar_url && (
                  <img
                    src={banner.gambar_url}
                    alt={banner.judul}
                    className="max-h-72 w-full object-cover"
                  />
                )}
                <div className="flex flex-col gap-2 p-5 sm:p-6">
                  <span className="w-fit rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
                    PROMO
                  </span>
                  <h2 className="text-xl font-extrabold sm:text-2xl">{banner.judul}</h2>
                  {banner.teks && (
                    <p className="text-sm leading-relaxed text-teks-lembut">{banner.teks}</p>
                  )}
                  {banner.tautan && (
                    <span className="mt-1 text-sm font-semibold text-utama">
                      Lihat penawaran →
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <article key={banner.id}>
                {banner.tautan ? (
                  <a href={banner.tautan} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-90">
                    {isiBanner}
                  </a>
                ) : (
                  isiBanner
                )}
              </article>
            );
          })}
        </section>
      )}

      <section aria-labelledby="judul-artikel" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="judul-artikel" className="text-xl font-bold">
              Artikel & Insight Sirkular
            </h2>
            <p className="text-sm text-teks-lembut">
              Pelajari cara memilah, mengelola, dan memanfaatkan kembali material sisa.
            </p>
          </div>
          <Link href="/artikel" className="shrink-0 text-sm font-semibold text-utama hover:underline">
            Lihat semua →
          </Link>
        </div>

        {daftarArtikel.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Artikel edukasi sedang disiapkan.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {daftarArtikel.map((item) => (
              <Link
                key={item.id}
                href={`/artikel/${item.slug}`}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-garis bg-latar transition-colors hover:border-utama"
              >
                <div>
                  {item.cover_image && (
                    <img
                      src={item.cover_image}
                      alt={item.title}
                      className="h-40 w-full border-b border-garis object-cover"
                    />
                  )}
                  <div className="p-5 pb-0">
                    <span className="inline-block rounded-full bg-permukaan px-2.5 py-1 text-xs font-semibold text-utama">
                      {item.topic}
                    </span>
                    <h3 className="mt-3 text-base font-bold leading-snug">{item.title}</h3>
                    {item.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-teks-lembut">{item.excerpt}</p>
                    )}
                  </div>
                </div>
                <span className="mt-4 block px-5 pb-5 text-xs font-semibold text-utama">
                  Baca selengkapnya →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {daftarKategori.length > 0 && (
        <section aria-labelledby="judul-kategori" className="flex flex-col gap-4">
          <h2 id="judul-kategori" className="text-xl font-bold">
            Kategori Material & Produk
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {daftarKategori.map((kat) => (
              <Link
                key={kat}
                href={`/kategori/${buatSlug(kat)}`}
                className="rounded-xl border border-garis bg-permukaan p-4 text-sm font-semibold transition-colors hover:border-utama hover:text-utama"
              >
                {kat}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="marketplace" aria-labelledby="judul-produk" className="flex flex-col gap-5 scroll-mt-6">
        <h2 id="judul-produk" className="text-xl font-bold">
          Marketplace SIRKULA
        </h2>

        {pesanError ? (
          <p role="alert" className="rounded-xl border border-bahaya/30 bg-bahaya/5 p-4 text-sm text-bahaya">
            {pesanError}
          </p>
        ) : daftarProduk.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada produk.
          </p>
        ) : (
          <FilterProduk daftarProduk={daftarProduk} />
        )}
      </section>

      <section className="rounded-2xl border border-garis bg-permukaan p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold">
          Punya Material Sisa atau Produk Daur Ulang?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teks-lembut">
          Bergabung sebagai penjual atau pemasok di SIRKULA DAURLINK. Pasarkan material terpilah maupun karya upcycle Anda ke pembeli dan UMKM lintas sektor.
        </p>
        <div className="mt-5">
          <Link
            href="/penjual"
            className="inline-block rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Buka Toko Sekarang →
          </Link>
        </div>
      </section>
    </div>
  );
}