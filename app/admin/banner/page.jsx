
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { simpanBanner, ubahStatusBanner } from "./actions";

export const dynamic = "force-dynamic";

export default async function HalamanAdminBanner() {
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

  const supabase = createSupabaseServerClient();

  const { data: daftarBanner, error } = await supabase
    .from("banner_promo")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal mengambil data banner.");
  }

  return (
    <main className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            Kelola Banner Promo
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Tambahkan dan atur banner promosi katalog SIRKULA.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-garis px-4 py-2 text-sm font-semibold hover:bg-permukaan"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Form tambah banner */}
      <section className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-5">
        <h2 className="text-xl font-bold">
          Tambah Banner Baru
        </h2>

        <form action={simpanBanner} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="judul" className="text-sm font-semibold">
              Judul banner *
            </label>
            <input
              id="judul"
              name="judul"
              required
              maxLength={150}
              placeholder="Contoh: Promo Spesial Akhir Tahun"
              className="rounded-xl border border-garis bg-latar px-4 py-3"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="teks" className="text-sm font-semibold">
              Teks promosi
            </label>
            <textarea
              id="teks"
              name="teks"
              maxLength={1000}
              rows={3}
              placeholder="Tuliskan informasi promo..."
              className="rounded-xl border border-garis bg-latar px-4 py-3"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gambar_url" className="text-sm font-semibold">
              URL gambar banner
            </label>
            <input
              id="gambar_url"
              name="gambar_url"
              type="url"
              placeholder="https://contoh.com/banner.jpg"
              className="rounded-xl border border-garis bg-latar px-4 py-3"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tautan" className="text-sm font-semibold">
              Tautan tujuan
            </label>
            <input
              id="tautan"
              name="tautan"
              type="url"
              placeholder="https://contoh.com/promo"
              className="rounded-xl border border-garis bg-latar px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-xl bg-utama px-6 py-3 font-semibold text-white hover:bg-utama-gelap"
          >
            Simpan Banner
          </button>
        </form>
      </section>

      {/* Daftar dan edit banner */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Daftar Banner ({daftarBanner?.length ?? 0})
        </h2>

        {!daftarBanner || daftarBanner.length === 0 ? (
          <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">
            Belum ada banner. Silakan tambahkan banner baru.
          </p>
        ) : (
          daftarBanner.map((banner) => (
            <article
              key={banner.id}
              className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{banner.judul}</h3>
                  <p className="mt-1 text-sm text-teks-lembut">
                    Status: {banner.aktif ? "Aktif" : "Nonaktif"}
                  </p>
                </div>

                <form action={ubahStatusBanner}>
                  <input
                    type="hidden"
                    name="id"
                    value={banner.id}
                  />
                  <input
                    type="hidden"
                    name="aktif"
                    value={banner.aktif ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      banner.aktif
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {banner.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
              </div>

              {banner.gambar_url && (
                <img
                  src={banner.gambar_url}
                  alt={banner.judul}
                  className="max-h-52 w-full rounded-xl object-cover"
                />
              )}

              {/* Form edit banner */}
              <details className="rounded-xl border border-garis p-4">
                <summary className="cursor-pointer font-semibold">
                  Edit Banner
                </summary>

                <form
                  action={simpanBanner}
                  className="mt-4 flex flex-col gap-4"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={banner.id}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Judul banner *
                    </label>
                    <input
                      name="judul"
                      required
                      maxLength={150}
                      defaultValue={banner.judul}
                      className="rounded-xl border border-garis bg-latar px-4 py-3"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Teks promosi
                    </label>
                    <textarea
                      name="teks"
                      maxLength={1000}
                      rows={3}
                      defaultValue={banner.teks || ""}
                      className="rounded-xl border border-garis bg-latar px-4 py-3"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      URL gambar
                    </label>
                    <input
                      name="gambar_url"
                      type="url"
                      defaultValue={banner.gambar_url || ""}
                      className="rounded-xl border border-garis bg-latar px-4 py-3"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Tautan tujuan
                    </label>
                    <input
                      name="tautan"
                      type="url"
                      defaultValue={banner.tautan || ""}
                      className="rounded-xl border border-garis bg-latar px-4 py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    className="self-start rounded-xl bg-utama px-6 py-3 font-semibold text-white"
                  >
                    Simpan Perubahan
                  </button>
                </form>
              </details>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
