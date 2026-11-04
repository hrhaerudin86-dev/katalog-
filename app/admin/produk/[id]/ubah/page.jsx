
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProdukAdmin } from "@/app/admin/actions";

export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;

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

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <h1 className="text-2xl font-extrabold">
        Ubah produk
      </h1>

      <FormProduk
        produk={produk}
        daftarKategori={daftarKategori ?? []}
        labelTombol="Simpan perubahan"
        action={simpanPerubahan}
      />
    </div>
  );
}
