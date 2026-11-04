
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DaftarTerakhirDilihat from "@/components/DaftarTerakhirDilihat";

export const dynamic = "force-dynamic";

export default async function HalamanTerakhirDilihat() {
  const supabase = await createSupabaseServerClient();

  const { data: produk, error } = await supabase
    .from("produk")
    .select(
      "id, nama, harga, harga_diskon, badge, stok, deskripsi, foto_url, kategori, created_at"
    )
    .eq("aktif", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal mengambil data produk terakhir dilihat.");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            Terakhir Dilihat
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Produk yang pernah kamu lihat sebelumnya.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold text-utama hover:underline"
        >
          Kembali ke Katalog
        </Link>
      </div>

      <DaftarTerakhirDilihat produk={produk ?? []} />
    </main>
  );
}
