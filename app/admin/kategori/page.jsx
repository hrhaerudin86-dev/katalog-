
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  tambahKategori,
  ubahKategori,
  hapusKategori,
} from "./actions";

export default async function HalamanKategori({ searchParams }) {
  const params = await searchParams;

  // Pemeriksaan login admin
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

  // Mengambil kategori dari database
  const supabase = createSupabaseServerClient();

  const { data: daftarKategori, error } = await supabase
    .from("kategori")
    .select("id, nama")
    .order("nama", { ascending: true });

  if (error) {
    console.error("Gagal mengambil kategori:", error);
    throw new Error("Gagal memuat kategori. Silakan coba lagi.");
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <h1 className="text-2xl font-extrabold">
          Kelola Kategori
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Tambahkan, ubah, dan kelola kategori produk SIRKULA.
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      {params.success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {params.success}
        </div>
      )}

      {/* Form tambah kategori */}
      <section className="rounded-xl border border-garis p-5">
        <h2 className="mb-4 text-lg font-bold">
          Tambah Kategori
        </h2>

        <form action={tambahKategori} className="flex flex-wrap gap-3">
          <input
            type="text"
            name="nama"
            placeholder="Masukkan nama kategori baru"
            required
            maxLength={100}
            className="min-w-0 flex-1 rounded-lg border border-garis bg-latar px-4 py-3"
          />

          <button
            type="submit"
            className="rounded-lg bg-utama px-5 py-3 font-bold text-white hover:opacity-90"
          >
            Tambah
          </button>
        </form>
      </section>

      {/* Daftar kategori */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Daftar Kategori
          </h2>

          <span className="text-sm text-teks-lembut">
            {daftarKategori?.length ?? 0} kategori
          </span>
        </div>

        {daftarKategori?.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-garis">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-garis bg-latar text-left">
                  <th className="p-4">No.</th>
                  <th className="p-4">Nama Kategori</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {daftarKategori.map((kategori, index) => (
                  <tr
                    key={kategori.id}
                    className="border-b border-garis last:border-0"
                  >
                    <td className="p-4">{index + 1}</td>

                    <td className="p-4">
                      <form
                        action={ubahKategori}
                        className="flex flex-wrap gap-2"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={kategori.id}
                        />

                        <input
                          type="text"
                          name="nama"
                          defaultValue={kategori.nama}
                          required
                          maxLength={100}
                          className="min-w-0 flex-1 rounded-lg border border-garis bg-latar px-3 py-2"
                        />

                        <button
                          type="submit"
                          className="rounded-lg border border-garis px-4 py-2 font-semibold hover:bg-latar"
                        >
                          Simpan
                        </button>
                      </form>
                    </td>

                    <td className="p-4">
                      <form action={hapusKategori}>
                        <input
                          type="hidden"
                          name="id"
                          value={kategori.id}
                        />

                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">
            Belum ada kategori.
          </p>
        )}
      </section>
    </div>
  );
}
