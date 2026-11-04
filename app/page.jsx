
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";
import FilterProduk from "@/components/FilterProduk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HalamanKatalog() {
  let daftarProduk = [];
  let pesanError = "";

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_diskon, badge, stok, deskripsi, foto_url, kategori, created_at"
      )
      .eq("aktif", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    daftarProduk = data ?? [];
  } catch (error) {
    console.error("Gagal mengambil katalog dari Supabase:", error);

    pesanError =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui saat mengambil produk.";
  }

  return (
    <>
      <section className="py-10 sm:py-14">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {toko.nama}
        </h1>

        <p className="mt-3 max-w-xl text-lg text-teks-lembut">
          {toko.tagline}
        </p>

        <p className="mt-4 text-sm text-teks-lembut">
          {toko.jamBuka}
        </p>
      </section>

      <section aria-labelledby="judul-produk" className="flex flex-col gap-5">
        <h2 id="judul-produk" className="text-xl font-bold">
          Produk kami
        </h2>

        {pesanError ? (
          <p
            role="alert"
            className="rounded-xl border border-bahaya/30 bg-bahaya/5 p-4 text-sm text-bahaya"
          >
            Katalog belum dapat dimuat dari database. Detail: {pesanError}
          </p>
        ) : daftarProduk.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada produk.
          </p>
        ) : (
          <FilterProduk daftarProduk={daftarProduk} />
        )}
      </section>
    </>
  );
}
