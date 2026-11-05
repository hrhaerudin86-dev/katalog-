import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import {
  tambahAkunAdmin,
  ubahStatusAkunAdmin,
  hapusAkunAdmin,
} from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function ambilAdminAktif() {
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
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) redirect("/admin/login");

  return user;
}

export default async function HalamanAkunAdmin({ searchParams }) {
  const adminAktif = await ambilAdminAktif();
  const query = await searchParams;

  const supabaseAdmin = createSupabaseServerClient();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (error) {
    throw new Error("Gagal mengambil daftar akun admin.");
  }

  const daftarAdmin = data.users ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 py-8">
      <h1 className="text-3xl font-extrabold">Kelola Akun Admin</h1>

      <NavAdmin />

      {query.success && (
        <p className="rounded-xl bg-green-100 p-3 text-green-800">
          {query.success}
        </p>
      )}

      {query.error && (
        <p className="rounded-xl bg-red-100 p-3 text-red-800">
          {query.error}
        </p>
      )}

      <section className="rounded-2xl border border-garis p-6">
        <h2 className="text-xl font-bold">Tambah Admin Baru</h2>

        <form action={tambahAkunAdmin} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Email admin
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@contoh.com"
              className="rounded-lg border border-garis bg-latar px-4 py-3"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              placeholder="Minimal 8 karakter"
              className="rounded-lg border border-garis bg-latar px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-lg bg-utama px-5 py-3 font-bold text-white hover:opacity-90"
          >
            Tambah Admin
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Daftar Admin ({daftarAdmin.length})
        </h2>

        {daftarAdmin.length === 0 ? (
          <p className="rounded-xl border border-garis p-4 text-teks-lembut">
            Belum ada akun admin.
          </p>
        ) : (
          daftarAdmin.map((admin) => {
            const sedangLogin = admin.id === adminAktif.id;
            const nonaktif = Boolean(admin.banned_until);

            return (
              <article
                key={admin.id}
                className="flex flex-col gap-4 rounded-xl border border-garis p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-bold">{admin.email}</p>
                  <p className="text-xs text-teks-lembut">
                    ID: {admin.id}
                  </p>
                  <p className="text-sm text-teks-lembut">
                    {sedangLogin
                      ? "Akun yang sedang digunakan"
                      : nonaktif
                        ? "Nonaktif"
                        : "Aktif"}
                  </p>
                </div>

                {sedangLogin ? (
                  <span className="w-fit rounded-lg bg-permukaan px-3 py-2 text-sm font-semibold">
                    Akun Anda
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <form action={ubahStatusAkunAdmin}>
                      <input
                        type="hidden"
                        name="user_id"
                        value={admin.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={nonaktif ? "aktif" : "nonaktif"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-garis px-3 py-2 text-sm font-semibold hover:bg-permukaan"
                      >
                        {nonaktif ? "Aktifkan" : "Nonaktifkan"}
                      </button>
                    </form>

                    <form action={hapusAkunAdmin}>
                      <input
                        type="hidden"
                        name="user_id"
                        value={admin.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}