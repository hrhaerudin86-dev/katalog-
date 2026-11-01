import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProdukAdmin } from "@/app/admin/actions";

export default async function HalamanTambahProduk({ searchParams }) {
  const params = await searchParams;
  const pesanError = params?.error;

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <h1 className="text-2xl font-extrabold">Tambah produk</h1>

      {pesanError && (
        <p className="rounded-lg border border-bahaya/30 bg-bahaya/5 p-3 text-sm text-bahaya">
          {pesanError}
        </p>
      )}

      <FormProduk
        labelTombol="Simpan produk"
        action={tambahProdukAdmin}
      />
    </div>
  );
}