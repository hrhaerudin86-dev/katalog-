
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProdukAdmin } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HalamanTambahProduk({ searchParams }) {
  const params = await searchParams;

  // Periksa login admin
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  // Ambil kategori dari database
  const supabase = createSupabaseServerClient();

  const { data: daftarKategori, error } = await supabase
    .from("kategori")
    .select("id, nama")
    .order("nama", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil kategori: ${error.message}`);
  }

  // Ambil kembali nilai form setelah validasi gagal
  const formValues = {
    nama: params?.nama ?? "",
    harga: params?.harga ?? "",
    harga_diskon: params?.harga_diskon ?? "",
    badge: params?.badge ?? "",
    stok: params?.stok ?? "1",
    kategori: params?.kategori ?? "",
    foto_url: params?.foto_url ?? "",
    foto_galeri: params?.foto_galeri ?? "",
    deskripsi: params?.deskripsi ?? "",
  };

  // Ambil pesan error per kolom
  const formErrors = {
    nama: params?.errorNama ?? "",
    harga: params?.errorHarga ?? "",
  };

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
        daftarKategori={daftarKategori ?? []}
        formValues={formValues}
        formErrors={formErrors}
      />
    </div>
  );
}
