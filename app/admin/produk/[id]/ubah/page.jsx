
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProdukAdmin } from "@/app/admin/actions";

export default async function HalamanUbahProduk({
  params,
  searchParams,
}) {
  const { id } = await params;
  const query = await searchParams;

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

  // Ambil data produk dan kategori
  const supabase = createSupabaseServerClient();

  const [
    { data: produk, error: errorProduk },
    { data: daftarKategori, error: errorKategori },
  ] = await Promise.all([
    supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("kategori")
      .select("id, nama")
      .order("nama", { ascending: true }),
  ]);

  if (errorProduk) {
    throw new Error(`Gagal mengambil produk: ${errorProduk.message}`);
  }

  if (errorKategori) {
    throw new Error(`Gagal mengambil kategori: ${errorKategori.message}`);
  }

  if (!produk) {
    notFound();
  }

  const simpanPerubahan = updateProdukAdmin.bind(null, id);

  // Nilai dari URL diprioritaskan jika validasi sebelumnya gagal
  const formValues = {
    nama: query?.nama ?? produk.nama ?? "",
    harga: query?.harga ?? produk.harga ?? "",
    harga_diskon: query?.harga_diskon ?? produk.harga_diskon ?? "",
    badge: query?.badge ?? produk.badge ?? "",
    stok: query?.stok ?? produk.stok ?? 1,
    kategori: query?.kategori ?? produk.kategori ?? "",
    foto_url: query?.foto_url ?? produk.foto_url ?? "",
    foto_galeri:
      query?.foto_galeri ??
      (Array.isArray(produk.foto_galeri)
        ? produk.foto_galeri.join("\n")
        : ""),
    deskripsi: query?.deskripsi ?? produk.deskripsi ?? "",
  };

  // Pesan error per kolom
  const formErrors = {
    nama: query?.errorNama ?? "",
    harga: query?.errorHarga ?? "",
  };

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <h1 className="text-2xl font-extrabold">
        Ubah produk
      </h1>

      {query?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Gagal menyimpan perubahan: {query.error}
        </p>
      )}

      <FormProduk
        produk={produk}
        daftarKategori={daftarKategori ?? []}
        labelTombol="Simpan perubahan"
        action={simpanPerubahan}
        formValues={formValues}
        formErrors={formErrors}
      />
    </div>
  );
}
