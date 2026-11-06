
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import TombolTambahKeranjang from "@/components/TombolTambahKeranjang";
import TombolFavorit from "@/components/TombolFavorit";

function buatSlug(nama) {
  return String(nama || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function KartuProduk({ produk }) {
  const stokHabis = Number(produk.stok ?? 0) <= 0;

  const hargaNormal = Number(produk.harga);
  const hargaDiskon = Number(produk.harga_diskon);

  const adaDiskon =
    produk.harga_diskon !== null &&
    produk.harga_diskon !== undefined &&
    hargaDiskon > 0 &&
    hargaDiskon < hargaNormal;

  const badgeValid = ["Baru", "Terlaris"].includes(produk.badge);

  const slugKategori = buatSlug(produk.kategori);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-garis bg-latar">
      <div className="relative">
        <Link
          href={`/produk/${produk.id}`}
          className="group flex flex-1 flex-col"
        >
          <div className="relative">
            {produk.foto_url ? (
              <img
                src={produk.foto_url}
                alt={produk.nama}
                className="aspect-square w-full bg-permukaan object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-permukaan text-sm text-teks-lembut">
                Foto belum tersedia
              </div>
            )}

            {stokHabis && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                Habis
              </span>
            )}

            {badgeValid && (
              <span className="absolute right-3 top-3 rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
                {produk.badge}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">
            <h3 className="font-semibold leading-snug group-hover:text-utama">
              {produk.nama}
            </h3>

            <div className="mt-auto self-start">
              {adaDiskon ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-teks-lembut line-through">
                    {formatRupiah(hargaNormal)}
                  </span>

                  <span className="rounded-md bg-harga-latar px-2 py-0.5 text-sm font-bold text-harga">
                    {formatRupiah(hargaDiskon)}
                  </span>
                </div>
              ) : (
                <p className="rounded-md bg-harga-latar px-2 py-0.5 text-sm font-bold text-harga">
                  {formatRupiah(produk.harga)}
                </p>
              )}
            </div>
          </div>
        </Link>

        <TombolFavorit produkId={produk.id} />
      </div>

      <div className="flex flex-col gap-2 p-3 pt-0">
        {produk.kategori && (
          <Link
            href={`/kategori/${slugKategori}`}
            className="w-fit text-xs text-teks-lembut hover:text-utama hover:underline"
          >
            {produk.kategori}
          </Link>
        )}

        <TombolTambahKeranjang produk={produk} />
      </div>
    </div>
  );
}
