
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NavAdmin from "@/components/NavAdmin";

const labelAksi = {
  tambah_produk: "Menambahkan produk",
  ubah_produk: "Mengubah produk",
  hapus_produk: "Menghapus produk",
};

export default async function LogAktivitasPage() {
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
            // Cookie tidak perlu diubah saat halaman hanya membaca data.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const supabase = createSupabaseServerClient();

  const { data: logs, error } = await supabase
    .from("log_aktivitas_admin")
    .select(
      "id, admin_id, admin_email, aksi, produk_id, nama_produk, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Gagal mengambil log aktivitas:", error.message);
  }

  const daftarLog = logs || [];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-utama">
          PANEL ADMIN
        </p>
        <h1 className="text-2xl font-bold">
          Log Aktivitas Admin
        </h1>
        <p className="text-sm text-teks-lembut">
          Riwayat aktivitas penambahan, perubahan, dan penghapusan produk.
        </p>
      </header>

      <NavAdmin />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Riwayat Aktivitas
          </h2>
          <span className="rounded-full border border-garis px-3 py-1 text-sm">
            {daftarLog.length} aktivitas terakhir
          </span>
        </div>

        {error ? (
          <div className="rounded-xl border border-bahaya p-4 text-sm">
            Gagal memuat log aktivitas. Periksa konfigurasi Supabase.
          </div>
        ) : daftarLog.length === 0 ? (
          <div className="rounded-xl border border-garis p-8 text-center">
            <p className="font-semibold">Belum ada aktivitas admin.</p>
            <p className="mt-1 text-sm text-teks-lembut">
              Aktivitas admin akan muncul setelah ada penambahan,
              perubahan, atau penghapusan produk.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-garis">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-latar">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Aktivitas</th>
                  <th className="px-4 py-3 font-semibold">Nama Produk</th>
                  <th className="px-4 py-3 font-semibold">ID Produk</th>
                </tr>
              </thead>

              <tbody>
                {daftarLog.map((log) => (
                  <tr key={log.id} className="border-t border-garis">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {log.admin_email}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {labelAksi[log.aksi] || log.aksi}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {log.nama_produk}
                    </td>

                    <td className="px-4 py-3">
                      {log.produk_id ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
