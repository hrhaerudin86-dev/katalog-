import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HalamanArtikel({ searchParams }) {
  const params = await searchParams;
  const topikAktif = params?.topik || "";

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("articles")
    .select("id, title, slug, topic, excerpt, cover_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (topikAktif) {
    query = query.eq("topic", topikAktif);
  }

  const { data: daftarArtikel } = await query;
  const { data: semuaTopik } = await supabase
    .from("articles")
    .select("topic")
    .eq("status", "published");

  const daftarTopikUnik = [...new Set((semuaTopik ?? []).map((t) => t.topic).filter(Boolean))];

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/" className="text-sm text-teks-lembut hover:text-utama">
          ← Kembali ke Beranda
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold">Artikel & Insight Sirkular</h1>
        <p className="mt-2 text-sm text-teks-lembut">
          Wawasan pemilahan, pengelolaan material sisa, dan kisah pelaku usaha upcycle.
        </p>
      </div>

      {/* Filter Topik */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/artikel"
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
            !topikAktif
              ? "border-utama bg-utama text-white"
              : "border-garis bg-latar text-teks-lembut hover:border-utama"
          }`}
        >
          Semua Topik
        </Link>
        {daftarTopikUnik.map((topik) => (
          <Link
            key={topik}
            href={`/artikel?topik=${encodeURIComponent(topik)}`}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
              topikAktif === topik
                ? "border-utama bg-utama text-white"
                : "border-garis bg-latar text-teks-lembut hover:border-utama"
            }`}
          >
            {topik}
          </Link>
        ))}
      </div>

      {/* Daftar Artikel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(daftarArtikel ?? []).map((item) => (
          <Link
            key={item.id}
            href={`/artikel/${item.slug}`}
            className="flex flex-col justify-between overflow-hidden rounded-2xl border border-garis bg-latar transition-colors hover:border-utama"
          >
            <div>
              {item.cover_url && (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="h-44 w-full border-b border-garis object-cover"
                />
              )}
              <div className="p-5 pb-0">
                <span className="inline-block rounded-full bg-permukaan px-2.5 py-1 text-xs font-semibold text-utama">
                  {item.topic}
                </span>
                <h2 className="mt-3 text-lg font-bold leading-snug">{item.title}</h2>
                {item.excerpt && (
                  <p className="mt-2 text-sm text-teks-lembut">{item.excerpt}</p>
                )}
              </div>
            </div>
            <span className="mt-4 block px-5 pb-5 text-xs font-semibold text-utama">
              Baca artikel →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}