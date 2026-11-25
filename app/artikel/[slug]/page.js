import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DetailArtikel({ params }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: artikel } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!artikel) {
    notFound();
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <Link href="/artikel" className="text-sm text-teks-lembut hover:text-utama">
        ← Kembali ke Daftar Artikel
      </Link>

      <div>
        <span className="inline-block rounded-full bg-permukaan px-3 py-1 text-xs font-semibold text-utama">
          {artikel.topic}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          {artikel.title}
        </h1>
      </div>

      {artikel.cover_image && (
        <img
          src={artikel.cover_image}
          alt={artikel.title}
          className="max-h-96 w-full rounded-2xl object-cover"
        />
      )}

      <div className="whitespace-pre-line text-base leading-relaxed text-teks-lembut">
        {artikel.content}
      </div>

      {artikel.related_category_slug && (
        <div className="mt-4 rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-sm font-bold">Tertarik dengan material ini?</p>
          <p className="mt-1 text-sm text-teks-lembut">
            Lihat produk dan material terkait yang tersedia di Marketplace SIRKULA.
          </p>
          <Link
            href={`/kategori/${artikel.related_category_slug}`}
            className="mt-3 inline-block rounded-xl bg-utama px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Lihat Kategori Terkait →
          </Link>
        </div>
      )}
    </article>
  );
}