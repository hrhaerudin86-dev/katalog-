
import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProdukAdmin } from "@/app/admin/actions";

export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();

  const { data: produk, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil produk: ${error.message}`);
  }

  if (!produk) {
    notFound();
  }

  const simpanPerubahan = updateProdukAdmin.bind(null, id);

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      <FormProduk
        produk={produk}
        labelTombol="Simpan perubahan"
        action={simpanPerubahan}
      />
    </div>
  );
}
