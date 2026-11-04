
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HalamanAdmin() {
  // Periksa sesi login admin
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

  // Ambil data produk dari database
  const supabase = createSupabaseServerClient();

  const { data: daftarProduk, error } = await supabase
    .from("produk")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil produk: ${error.message}`);
  }

  const produk = daftarProduk ?? [];

  // Hitung jumlah produk berdasarkan kategori
  const ringkasanKategori = produk.reduce((hasil, item) => {
    const kategori = item.kategori?.trim() || "Tanpa kategori";

    hasil[kategori] = (hasil[kategori] || 0) + 1;

    return hasil;
  }, {});

  const daftarKategori = Object.entries(ringkasanKategori).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            Dashboard Admin
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Ringkasan kondisi katalog produk SIRKULA.
          </p>
        </div>

        <Tombol href="/admin/produk/baru">
          Tambah produk
        </Tombol>
      </div>

      {/* Ringkasan jumlah produk */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-garis bg-latar p-6">
          <p className="text-sm text-teks-lembut">
            Total Produk
          </p>
          <p className="mt-3 text-4xl font-extrabold text-utama">
            {produk.length}
          </p>
          <p className="mt-2 text-sm text-teks-lembut">
            Produk terdaftar di katalog
          </p>
        </div>

        <div className="rounded-2xl border border-garis bg-latar p-6">
          <p className="text-sm text-teks-lembut">
            Total Kategori
          </p>
          <p className="mt-3 text-4xl font-extrabold text-utama">
            {daftarKategori.length}
          </p>
          <p className="mt-2 text-sm text-teks-lembut">
            Kategori produk yang tersedia
          </p>
        </div>
      </section>

      {/* Ringkasan produk per kategori */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Produk per Kategori
        </h2>

        {daftarKategori.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daftarKategori.map(([kategori, jumlah]) => (
              <div
                key={kategori}
                className="flex items-center justify-between gap-3 rounded-xl border border-garis bg-latar p-4"
              >
                <span className="font-medium">
                  {kategori}
                </span>

                <span className="rounded-lg bg-utama px-3 py-1.5 text-sm font-bold text-white">
                  {jumlah} produk
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">
            Belum ada produk dalam katalog.
          </p>
        )}
      </section>

      {/* Tabel pengelolaan produk */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Kelola Produk
        </h2>

        <TabelProduk daftarProduk={produk} />
      </section>
    </div>
  );
}
