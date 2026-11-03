
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DaftarFavorit from "@/components/DaftarFavorit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HalamanFavorit() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("produk")
    .select("id, nama, harga, harga_diskon, foto_url, kategori")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="py-10">
        <h1 className="mb-4 text-3xl font-extrabold">
          Produk Favorit
        </h1>
        <p className="rounded-xl border border-bahaya/30 bg-bahaya/5 p-4 text-sm text-bahaya">
          Produk favorit belum dapat dimuat. Silakan coba lagi.
        </p>
        <Link href="/" className="mt-4 inline-block text-utama underline">
          Kembali ke katalog
        </Link>
      </section>
    );
  }

  return <DaftarFavorit daftarProduk={data ?? []} />;
}
