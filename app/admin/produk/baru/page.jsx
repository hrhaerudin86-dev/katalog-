
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProdukAdmin } from "@/app/admin/actions";

export default async function HalamanTambahProduk({ searchParams }) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <h1 className="text-2xl font-extrabold">Tambah produk</h1>

      {params?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Gagal menyimpan produk: {params.error}
        </p>
      )}

      <FormProduk
        labelTombol="Simpan produk"
        action={tambahProdukAdmin}
      />
    </div>
  );
}
