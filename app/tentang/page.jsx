
import Link from "next/link";
import { toko } from "@/lib/toko";

export default function HalamanTentang() {
  const nomorWhatsApp = toko.nomorWhatsApp.replace(/\D/g, "");

  return (
    <section className="flex flex-col gap-8 py-12">
      <div className="rounded-2xl bg-utama p-8 text-white sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest">
          Tentang Kami
        </p>

        <h1 className="mt-3 text-4xl font-extrabold">
          {toko.nama}
        </h1>

        <p className="mt-3 text-xl font-semibold">
          {toko.tagline}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Profil SIRKULA</h2>

        <p className="leading-relaxed text-teks-lembut">
          SIRKULA merupakan katalog produk UMKM yang mengangkat semangat
          pemanfaatan kembali bahan sisa dan limbah menjadi produk yang
          memiliki nilai guna dan nilai ekonomi. Melalui semangat
          "Dari Limbah Menjadi Berkah", SIRKULA memperkenalkan berbagai
          produk kreatif yang dapat menjadi alternatif kebutuhan sehari-hari.
        </p>

        <p className="leading-relaxed text-teks-lembut">
          Kami menghadirkan katalog digital untuk membantu pengunjung
          mengenal produk, melihat informasi harga, dan melakukan pemesanan
          secara praktis melalui WhatsApp.
        </p>
      </div>

      <div className="rounded-2xl border border-garis p-6">
        <h2 className="text-2xl font-bold">Informasi Toko</h2>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <p className="text-sm text-teks-lembut">Nama Toko</p>
            <p className="font-semibold">{toko.nama}</p>
          </div>

          <div>
            <p className="text-sm text-teks-lembut">Alamat</p>
            <p className="font-semibold">{toko.alamat}</p>
          </div>

          <div>
            <p className="text-sm text-teks-lembut">Jam Operasional</p>
            <p className="font-semibold">{toko.jamBuka}</p>
          </div>

          <div>
            <p className="text-sm text-teks-lembut">WhatsApp</p>
            <p className="font-semibold">{toko.nomorWhatsApp}</p>
          </div>
        </div>

        <a
          href={`https://wa.me/${nomorWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-xl bg-utama px-5 py-3 font-bold text-white hover:opacity-90"
        >
          Hubungi Kami via WhatsApp
        </a>
      </div>

      <Link
        href="/"
        className="self-start text-sm font-semibold text-utama underline underline-offset-4"
      >
        Kembali ke Katalog
      </Link>
    </section>
  );
}
