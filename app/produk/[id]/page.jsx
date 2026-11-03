
import Link from "next/link";
import { notFound } from "next/navigation";
import TombolWhatsApp from "@/components/TombolWhatsApp";
import KartuProduk from "@/components/KartuProduk";
import GaleriProduk from "@/components/GaleriProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";

export default async function HalamanDetailProduk({ params }) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: produk, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil detail produk: ${error.message}`);
  }

  if (!produk) {
    notFound();
  }

  const hargaNormal = Number(produk.harga);
  const hargaDiskon = Number(produk.harga_diskon);

  const adaDiskon =
    produk.harga_diskon !== null &&
    produk.harga_diskon !== undefined &&
    hargaDiskon > 0 &&
    hargaDiskon < hargaNormal;

  const badgeValid = ["Baru", "Terlaris"].includes(produk.badge);

  let produkTerkait = [];

  if (produk.kategori) {
    const { data } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_diskon, badge, stok, deskripsi, foto_url, kategori, created_at"
      )
      .eq("kategori", produk.kategori)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(4);

    produkTerkait = data ?? [];
  }

  return (
    <>
      <article className="grid gap-8 py-8 md:grid-cols-2 md:py-12">
        <div className="flex flex-col gap-3">
          {badgeValid && (
            <span className="self-start rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
              {produk.badge}
            </span>
          )}

          <GaleriProduk
            fotoUtama={produk.foto_url}
            fotoGaleri={produk.foto_galeri}
            namaProduk={produk.nama}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama"
          >
            Kembali ke katalog
          </Link>

          <p className="text-sm text-teks-lembut">
            {produk.kategori}
          </p>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            {produk.nama}
          </h1>

          {adaDiskon ? (
            <div className="flex flex-col items-start gap-1">
              <span className="text-base text-teks-lembut line-through">
                {formatRupiah(hargaNormal)}
              </span>

              <span className="rounded-md bg-harga-latar px-3 py-1 text-2xl font-bold text-harga">
                {formatRupiah(hargaDiskon)}
              </span>
            </div>
          ) : (
            <p className="self-start rounded-md bg-harga-latar px-3 py-1 text-xl font-bold text-harga">
              {formatRupiah(produk.harga)}
            </p>
          )}

          <p className="max-w-prose leading-relaxed text-teks-lembut">
            {produk.deskripsi}
          </p>

          <TombolWhatsApp produk={produk} />
        </div>
      </article>

      {produkTerkait.length > 0 && (
        <section className="flex flex-col gap-5 pb-12">
          <h2 className="text-xl font-bold">
            Produk Terkait
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {produkTerkait.map((item) => (
              <KartuProduk key={item.id} produk={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
