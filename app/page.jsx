
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";
import FilterProduk from "@/components/FilterProduk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HalamanKatalog() {
  let daftarProduk = [];
  let daftarBanner = [];
  let pesanError = "";

  try {
    const supabase = await createSupabaseServerClient();

    // Ambil produk aktif
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

    // Ambil hanya banner yang aktif
    const { data: banner, error: errorBanner } = await supabase
      .from("banner_promo")
      .select("id, judul, teks, gambar_url, tautan")
      .eq("aktif", true)
      .order("created_at", { ascending: false });

    if (errorBanner) {
      console.error("Gagal mengambil banner promo:", errorBanner);
    } else {
      daftarBanner = banner ?? [];
    }
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

      {/* Banner promo aktif */}
      {daftarBanner.length > 0 && (
        <section
          aria-label="Promo toko"
          className="mb-10 flex flex-col gap-5"
        >
          {daftarBanner.map((banner) => {
            const isiBanner = (
              <div className="overflow-hidden rounded-2xl border border-garis bg-latar">
                {banner.gambar_url && (
                  <img
                    src={banner.gambar_url}
                    alt={banner.judul}
                    className="max-h-80 w-full object-cover"
                  />
                )}

                <div className="flex flex-col gap-2 p-5 sm:p-7">
                  <span className="w-fit rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
                    PROMO
                  </span>

                  <h2 className="text-2xl font-extrabold">
                    {banner.judul}
                  </h2>

                  {banner.teks && (
                    <p className="leading-relaxed text-teks-lembut">
                      {banner.teks}
                    </p>
                  )}

                  {banner.tautan && (
                    <span className="mt-2 font-semibold text-utama">
                      Lihat penawaran →
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <article key={banner.id}>
                {banner.tautan ? (
                  <a
                    href={banner.tautan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-90"
                  >
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
