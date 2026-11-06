
import Link from "next/link";
import { notFound } from "next/navigation";
import TombolWhatsApp from "@/components/TombolWhatsApp";
import TombolTambahKeranjang from "@/components/TombolTambahKeranjang";
import TombolBagikan from "@/components/TombolBagikan";
import KartuProduk from "@/components/KartuProduk";
import GaleriProduk from "@/components/GaleriProduk";
import CatatProdukDilihat from "@/components/CatatProdukDilihat";
import FormUlasan from "@/components/FormUlasan";
import TanyaAIProduk from "@/components/TanyaAIProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ambilPengaturanToko } from "@/lib/pengaturan-toko";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HalamanDetailProduk({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createSupabaseServerClient();
  const pengaturan = await ambilPengaturanToko();

  const { data: produk, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id", id)
    .eq("aktif", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil detail produk: ${error.message}`);
  }

  if (!produk) notFound();

  const { data: varian, error: errorVarian } = await supabase
    .from("produk_varian")
    .select("id, produk_id, nama_varian, harga")
    .eq("produk_id", produk.id)
    .order("id", { ascending: true });

  if (errorVarian) {
    throw new Error(`Gagal mengambil varian produk: ${errorVarian.message}`);
  }

  const daftarVarian = varian ?? [];

  const { data: ulasan, error: errorUlasan } = await supabase
    .from("ulasan_produk")
    .select("id, nama_pengulas, rating, komentar, created_at")
    .eq("produk_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (errorUlasan) {
    throw new Error("Gagal mengambil ulasan produk.");
  }

  const daftarUlasan = ulasan ?? [];
  const rataRata = daftarUlasan.length
    ? daftarUlasan.reduce((total, item) => total + item.rating, 0) /
      daftarUlasan.length
    : 0;

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
      .eq("aktif", true)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(4);

    produkTerkait = data ?? [];
  }

  return (
    <>
      <CatatProdukDilihat produkId={produk.id} />

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
          <Link href="/" className="text-sm text-teks-lembut underline">
            Kembali ke katalog
          </Link>

          <p className="text-sm text-teks-lembut">{produk.kategori}</p>

          <h1 className="text-3xl font-extrabold">{produk.nama}</h1>

          {daftarVarian.length === 0 && (
            <>
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
            </>
          )}

          <p className="leading-relaxed text-teks-lembut">
            {produk.deskripsi}
          </p>

          <TombolTambahKeranjang produk={produk} />

          <TombolWhatsApp
            produk={produk}
            nomorWhatsApp={pengaturan.nomorWhatsApp}
            varian={daftarVarian}
          />

          <TombolBagikan namaProduk={produk.nama} />
        </div>
      </article>

      <section className="py-8">
        <TanyaAIProduk produkId={produk.id} />
      </section>

      <section className="flex flex-col gap-5 py-8">
        <div>
          <h2 className="text-2xl font-bold">Ulasan Pelanggan</h2>
          <p className="mt-2 text-lg">
            {daftarUlasan.length
              ? `⭐ ${rataRata.toFixed(1)} dari 5 (${daftarUlasan.length} ulasan)`
              : "Belum ada ulasan untuk produk ini."}
          </p>
        </div>

        {query.ulasan === "menunggu" && (
          <p className="rounded-xl bg-green-100 p-3 text-green-800">
            Ulasan berhasil dikirim dan sedang menunggu persetujuan admin.
          </p>
        )}

        {query.ulasan && query.ulasan !== "menunggu" && (
          <p className="rounded-xl bg-red-100 p-3 text-red-800">
            Ulasan gagal dikirim. Periksa nama, rating, komentar, lalu coba lagi.
          </p>
        )}

        <FormUlasan produkId={produk.id} />

        <div className="flex flex-col gap-4">
          {daftarUlasan.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-garis p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-bold">{item.nama_pengulas}</h3>
                <span className="text-sm text-teks-lembut">
                  {new Date(item.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="my-2 text-amber-500">
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </p>
              <p className="leading-relaxed">{item.komentar}</p>
            </article>
          ))}
        </div>
      </section>

      {produkTerkait.length > 0 && (
        <section className="flex flex-col gap-5 pb-12">
          <h2 className="text-xl font-bold">Produk Terkait</h2>
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
