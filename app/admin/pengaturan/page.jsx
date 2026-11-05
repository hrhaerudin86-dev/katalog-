
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Link from "next/link";
import NavAdmin from "@/components/NavAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { simpanPengaturanToko } from "./actions";
import { toko } from "@/lib/toko";

export const dynamic = "force-dynamic";

export default async function HalamanPengaturanToko() {
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

  const { data, error } = await supabase
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal mengambil pengaturan toko.");
  }

  const pengaturan = data || {
    nama_toko: toko.nama,
    nomor_whatsapp: toko.nomorWhatsApp,
    jam_buka: toko.jamBuka,
    alamat: toko.alamat,
  };

  return (
    <main className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            Pengaturan Toko
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Ubah identitas dan informasi kontak toko SIRKULA.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-garis px-4 py-2 text-sm font-semibold hover:bg-permukaan"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-garis bg-latar p-5 sm:p-7">
        <form
          action={simpanPengaturanToko}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="nama_toko" className="font-semibold">
              Nama Toko
            </label>
            <input
              id="nama_toko"
              name="nama_toko"
              type="text"
              required
              maxLength={100}
              defaultValue={pengaturan.nama_toko}
              className="rounded-xl border border-garis bg-latar px-4 py-3 outline-none focus:border-utama"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="nomor_whatsapp" className="font-semibold">
              Nomor WhatsApp
            </label>
            <input
              id="nomor_whatsapp"
              name="nomor_whatsapp"
              type="tel"
              required
              defaultValue={pengaturan.nomor_whatsapp}
              placeholder="628xxxxxxxxxx"
              className="rounded-xl border border-garis bg-latar px-4 py-3 outline-none focus:border-utama"
            />
            <p className="text-xs text-teks-lembut">
              Gunakan kode negara 62, tanpa tanda + atau angka 0 di depan.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="jam_buka" className="font-semibold">
              Jam Buka
            </label>
            <input
              id="jam_buka"
              name="jam_buka"
              type="text"
              required
              maxLength={150}
              defaultValue={pengaturan.jam_buka}
              placeholder="Contoh: 08.00–21.00 WIB"
              className="rounded-xl border border-garis bg-latar px-4 py-3 outline-none focus:border-utama"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="alamat" className="font-semibold">
              Alamat Toko
            </label>
            <textarea
              id="alamat"
              name="alamat"
              required
              maxLength={500}
              rows={4}
              defaultValue={pengaturan.alamat}
              className="rounded-xl border border-garis bg-latar px-4 py-3 outline-none focus:border-utama"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-xl bg-utama px-6 py-3 font-semibold text-white hover:bg-utama-gelap"
          >
            Simpan Pengaturan
          </button>
        </form>
      </section>
    </main>
  );
}
