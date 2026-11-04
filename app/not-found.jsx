import Link from "next/link";

export default function TidakDitemukan() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="text-8xl font-extrabold tracking-tight text-utama">
        404
      </span>

      <h1 className="text-2xl font-extrabold">
        Halaman Tidak Ditemukan
      </h1>

      <p className="max-w-md leading-relaxed text-teks-lembut">
        Maaf, produk atau halaman yang kamu cari tidak ditemukan,
        mungkin sudah dihapus atau alamatnya salah.
      </p>

      <Link
        href="/"
        className="rounded-xl bg-utama px-6 py-3 font-bold text-white transition hover:bg-utama-gelap"
      >
        Kembali ke Katalog
      </Link>
    </main>
  );
}