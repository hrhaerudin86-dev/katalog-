
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProdukAdmin } from "@/app/admin/actions";

import {
  tambahVarianProduk,
  ubahVarianProduk,
  hapusVarianProduk,
} from "./varian-actions";

import { formatRupiah } from "@/lib/format";

export default async function HalamanUbahProduk({
  params,
  searchParams,
}) {
  const { id } = await params;
  const query = await searchParams;

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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie tidak dapat diubah pada konteks tertentu.
          }
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

  const supabase = createSupabaseServerClient();

  const [
    { data: produk, error: errorProduk },
    { data: daftarKategori, error: errorKategori },
    { data: daftarVarian, error: errorVarian },
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

    supabase
      .from("produk_varian")
      .select("id, produk_id, nama_varian, harga")
      .eq("produk_id", id)
      .order("id", { ascending: true }),
  ]);

  if (errorProduk) {
    console.error("Gagal mengambil data produk:", errorProduk);
    throw new Error("Gagal memuat data produk. Silakan coba lagi.");
  }

  if (errorKategori) {
    console.error("Gagal mengambil data kategori:", errorKategori);
    throw new Error("Gagal memuat data kategori. Silakan coba lagi.");
  }

  if (errorVarian) {
    console.error("Gagal mengambil data varian:", errorVarian);
    throw new Error("Gagal memuat data varian. Silakan coba lagi.");
  }

  if (!produk) {
    notFound();
  }

  const simpanPerubahan = updateProdukAdmin.bind(null, id);

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

      <section className="flex flex-col gap-5 rounded-2xl border border-garis bg-permukaan p-5">
        <div>
          <h2 className="text-xl font-extrabold">
            Kelola Varian Harga
          </h2>
          <p className="mt-1 text-sm text-teks-lembut">
            Tambahkan pilihan ukuran atau varian dengan harga berbeda
            untuk {produk.nama}.
          </p>
        </div>

        {query?.errorVarian && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {query.errorVarian}
          </p>
        )}

        {query?.successVarian && (
          <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {query.successVarian}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="font-bold">Tambah varian baru</h3>

          <form
            action={tambahVarianProduk}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <input
              type="hidden"
              name="produk_id"
              value={produk.id}
            />

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Nama varian
              <input
                type="text"
                name="nama_varian"
                placeholder="Contoh: 250 ml"
                maxLength={100}
                required
                className="rounded-xl border border-garis bg-latar px-4 py-3 font-normal outline-none focus:border-teks"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Harga (Rp)
              <input
                type="number"
                name="harga"
                min="0"
                step="1"
                placeholder="Contoh: 25000"
                required
                className="rounded-xl border border-garis bg-latar px-4 py-3 font-normal outline-none focus:border-teks"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-utama px-5 py-3 font-bold text-white hover:opacity-90"
            >
              Tambah varian
            </button>
          </form>
        </div>

        <div className="border-t border-garis pt-5">
          <h3 className="mb-3 font-bold">
            Daftar varian ({daftarVarian?.length ?? 0})
          </h3>

          {!daftarVarian || daftarVarian.length === 0 ? (
            <p className="rounded-xl border border-dashed border-garis p-5 text-center text-sm text-teks-lembut">
              Belum ada varian untuk produk ini.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {daftarVarian.map((varian) => (
                <div
                  key={varian.id}
                  className="rounded-xl border border-garis p-4"
                >
                  <form
                    action={ubahVarianProduk}
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
                  >
                    <input
                      type="hidden"
                      name="produk_id"
                      value={produk.id}
                    />

                    <input
                      type="hidden"
                      name="varian_id"
                      value={varian.id}
                    />

                    <label className="flex flex-col gap-2 text-sm font-semibold">
                      Nama varian
                      <input
                        type="text"
                        name="nama_varian"
                        defaultValue={varian.nama_varian}
                        maxLength={100}
                        required
                        className="rounded-xl border border-garis bg-latar px-3 py-2 font-normal outline-none focus:border-teks"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-semibold">
                      Harga (Rp)
                      <input
                        type="number"
                        name="harga"
                        min="0"
                        step="1"
                        defaultValue={varian.harga}
                        required
                        className="rounded-xl border border-garis bg-latar px-3 py-2 font-normal outline-none focus:border-teks"
                      />
                    </label>

                    <button
                      type="submit"
                      className="rounded-lg border border-garis px-4 py-2 font-semibold hover:bg-latar"
                    >
                      Simpan
                    </button>
                  </form>

                  <form
                    action={hapusVarianProduk}
                    className="mt-3 flex justify-end"
                  >
                    <input
                      type="hidden"
                      name="produk_id"
                      value={produk.id}
                    />

                    <input
                      type="hidden"
                      name="varian_id"
                      value={varian.id}
                    />

                    <button
                      type="submit"
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus varian
                    </button>
                  </form>

                  <p className="mt-2 text-sm text-teks-lembut">
                    Harga tersimpan: {formatRupiah(varian.harga)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
