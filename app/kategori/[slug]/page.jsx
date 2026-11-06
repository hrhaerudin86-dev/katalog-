
import { notFound } from "next/navigation";
import KartuProduk from "@/components/KartuProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buatSlug(nama) {
  return String(nama || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function HalamanKategori({ params }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: daftarKategori, error: errorKategori } = await supabase
    .from("kategori")
    .select("id, nama");

  if (errorKategori) {
    throw new Error(
      `Gagal mengambil kategori: ${errorKategori.message}`
    );
  }

  const kategori = (daftarKategori ?? []).find(
    (item) => buatSlug(item.nama) === slug
  );

  if (!kategori) {
    notFound();
  }

  const { data: produk, error: errorProduk } = await supabase
    .from("produk")
    .select("*")
    .eq("kategori", kategori.nama)
    .eq("aktif", true)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false });

  if (errorProduk) {
    throw new Error(
      `Gagal mengambil produk kategori: ${errorProduk.message}`
    );
  }

  const daftarProduk = produk ?? [];

  return (
    <main className="flex flex-col gap-8 py-8 md:py-12">
      <section className="flex flex-col gap-2">
        <p className="text-sm text-teks-lembut">
          Katalog / Kategori
        </p>

        <h1 className="text-3xl font-extrabold">
          {kategori.nama}
        </h1>

        <p className="text-teks-lembut">
          Menampilkan {daftarProduk.length} produk dalam kategori ini.
        </p>
      </section>

      {daftarProduk.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {daftarProduk.map((item) => (
            <KartuProduk key={item.id} produk={item} />
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-garis p-8 text-center">
          <h2 className="text-lg font-bold">
            Belum ada produk
          </h2>
          <p className="mt-2 text-sm text-teks-lembut">
            Belum ada produk aktif dalam kategori {kategori.nama}.
          </p>
        </div>
      )}
    </main>
  );
}
