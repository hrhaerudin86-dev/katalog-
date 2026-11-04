
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ubahStatusUlasan } from "./actions";

export const dynamic = "force-dynamic";

export default async function HalamanModerasiUlasan() {
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

  const { data: ulasan, error } = await supabase
    .from("ulasan_produk")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal mengambil data ulasan.");
  }

  const daftarUlasan = ulasan ?? [];

  const idProduk = [
    ...new Set(daftarUlasan.map((item) => item.produk_id)),
  ];

  let daftarProduk = [];

  if (idProduk.length > 0) {
    const { data, error: errorProduk } = await supabase
      .from("produk")
      .select("id, nama")
      .in("id", idProduk);

    if (errorProduk) {
      throw new Error("Gagal mengambil nama produk.");
    }

    daftarProduk = data ?? [];
  }

  const namaProduk = (id) =>
    daftarProduk.find((item) => String(item.id) === String(id))?.nama ||
    "Produk tidak ditemukan";

  const jumlahPending = daftarUlasan.filter(
    (item) => item.status === "pending"
  ).length;

  return (
    <main className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            Moderasi Ulasan
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Periksa dan kelola ulasan pelanggan.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-garis px-4 py-2 text-sm font-semibold hover:bg-permukaan"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-garis bg-latar p-5">
          <p className="text-sm text-teks-lembut">Total Ulasan</p>
          <p className="mt-2 text-3xl font-extrabold">
            {daftarUlasan.length}
          </p>
        </div>

        <div className="rounded-2xl border border-garis bg-latar p-5">
          <p className="text-sm text-teks-lembut">Menunggu Moderasi</p>
          <p className="mt-2 text-3xl font-extrabold text-utama">
            {jumlahPending}
          </p>
        </div>
      </div>

      {daftarUlasan.length === 0 ? (
        <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">
          Belum ada ulasan pelanggan.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {daftarUlasan.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {item.nama_pengulas}
                  </h2>
                  <p className="mt-1 text-sm text-teks-lembut">
                    Produk: {namaProduk(item.produk_id)}
                  </p>
                  <p className="mt-1 text-xs text-teks-lembut">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </div>

                <span className="rounded-full border border-garis px-3 py-1 text-xs font-semibold">
                  {item.status === "approved"
                    ? "Disetujui"
                    : item.status === "rejected"
                      ? "Ditolak"
                      : "Menunggu"}
                </span>
              </div>

              <p className="text-amber-500">
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </p>

              <p className="leading-relaxed">{item.komentar}</p>

              <div className="flex flex-wrap gap-2">
                <form action={ubahStatusUlasan}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="status"
                    value="approved"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Setujui
                  </button>
                </form>

                <form action={ubahStatusUlasan}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="status"
                    value="rejected"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Tolak
                  </button>
                </form>

                <form action={ubahStatusUlasan}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="status"
                    value="pending"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-garis px-4 py-2 text-sm font-semibold"
                  >
                    Kembalikan ke Menunggu
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
