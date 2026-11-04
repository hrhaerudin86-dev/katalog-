export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-garis border-t-utama" />

      <div className="text-center">
        <h2 className="text-lg font-bold">
          Memuat Katalog...
        </h2>

        <p className="mt-2 text-sm text-teks-lembut">
          Mohon tunggu sebentar, kami sedang menyiapkan produk untukmu.
        </p>
      </div>
    </div>
  );
}