
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PRODUK_PER_HALAMAN = 10;

export default async function HalamanAdmin({ searchParams }) {
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

  const params = await searchParams;
  const kataKunci = String(params?.q || "").trim();
  const nomorHalaman = Math.max(
    1,
    Number.parseInt(params?.page || "1", 10) || 1
  );

  const supabase = createSupabaseServerClient();

  // Ambil ringkasan seluruh produk
  const { data: semuaProduk, error: errorRingkasan } = await supabase
    .from("produk")
    .select("id, kategori, nama");

  if (errorRingkasan) {
    throw new Error(
      `Gagal mengambil ringkasan produk: ${errorRingkasan.message}`
    );
  }

  const produk = semuaProduk ?? [];

  const ringkasanKategori = produk.reduce((hasil, item) => {
    const kategori = item.kategori?.trim() || "Tanpa kategori";

    hasil[kategori] = (hasil[kategori] || 0) + 1;

    return hasil;
  }, {});

  const daftarKategori = Object.entries(ringkasanKategori).sort(
    (a, b) => b[1] - a[1]
  );

  // Ambil data klik WhatsApp dari database
  const { data: dataKlik, error: errorKlik } = await supabase
    .from("klik_whatsapp")
    .select("produk_id");

  if (errorKlik) {
    throw new Error(
      `Gagal mengambil data klik WhatsApp: ${errorKlik.message}`
    );
  }

  // Hitung jumlah klik setiap produk
  const jumlahKlikProduk = (dataKlik ?? []).reduce((hasil, item) => {
    const id = String(item.produk_id);
    hasil[id] = (hasil[id] || 0) + 1;
    return hasil;
  }, {});

  // Urutkan dan ambil 5 produk dengan klik terbanyak
  const produkTerlaris = produk
    .map((item) => ({
      ...item,
      jumlahKlik: jumlahKlikProduk[String(item.id)] || 0,
    }))
    .filter((item) => item.jumlahKlik > 0)
    .sort((a, b) => b.jumlahKlik - a.jumlahKlik)
    .slice(0, 5);

  // Query pencarian dan pagination langsung dari database
  const posisiAwal = (nomorHalaman - 1) * PRODUK_PER_HALAMAN;
  const posisiAkhir = posisiAwal + PRODUK_PER_HALAMAN - 1;

  let queryProduk = supabase
    .from("produk")
    .select("*", { count: "exact" });

  if (kataKunci) {
    const kataAman = kataKunci.replace(/[,%()]/g, " ");
    queryProduk = queryProduk.ilike("nama", `%${kataAman}%`);
  }

  const {
    data: daftarProduk,
    count,
    error,
  } = await queryProduk
    .order("urutan", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(posisiAwal, posisiAkhir);

  if (error) {
    throw new Error(`Gagal mengambil produk: ${error.message}`);
  }

  const totalProduk = count ?? 0;
  const totalHalaman = Math.ceil(totalProduk / PRODUK_PER_HALAMAN);
  const halamanAktif = Math.min(
    nomorHalaman,
    Math.max(1, totalHalaman)
  );

  // Jika nomor halaman melebihi jumlah halaman
  if (nomorHalaman > Math.max(1, totalHalaman)) {
    const paramsBaru = new URLSearchParams();

    if (kataKunci) paramsBaru.set("q", kataKunci);
    paramsBaru.set("page", String(halamanAktif));

    redirect(`/admin?${paramsBaru.toString()}`);
  }

  function buatUrlHalaman(halaman) {
    const urlParams = new URLSearchParams();

    if (kataKunci) {
      urlParams.set("q", kataKunci);
    }

    urlParams.set("page", String(halaman));

    return `/admin?${urlParams.toString()}`;
  }

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

        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/produk/export"
            className="rounded-xl border border-garis px-5 py-3 text-center font-semibold hover:bg-permukaan"
          >
            ↓ Ekspor CSV
          </a>

          <Tombol href="/admin/produk/baru">
            Tambah produk
          </Tombol>
        </div>
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

      {/* Produk terlaris berdasarkan klik WhatsApp */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">
            5 Produk Terlaris
          </h2>

          <p className="mt-1 text-sm text-teks-lembut">
            Berdasarkan jumlah klik tombol Pesan via WhatsApp.
          </p>
        </div>

        {produkTerlaris.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-garis">
            <div className="divide-y divide-garis">
              {produkTerlaris.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-latar p-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-utama text-lg font-extrabold text-white">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {item.nama}
                      </p>

                      <p className="mt-1 text-sm text-teks-lembut">
                        {item.kategori || "Tanpa kategori"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xl font-extrabold text-utama">
                      {item.jumlahKlik}
                    </p>

                    <p className="text-xs text-teks-lembut">
                      Klik WhatsApp
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-garis bg-latar p-6">
            <p className="font-semibold">
              Belum ada data produk terlaris.
            </p>

            <p className="mt-2 text-sm text-teks-lembut">
              Data akan muncul setelah pengunjung mengklik tombol
              Pesan via WhatsApp pada produk.
            </p>
          </div>
        )}
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

      {/* Pencarian dan pengelolaan produk */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">
          Kelola Produk
        </h2>

        <form
          action="/admin"
          method="GET"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={kataKunci}
            placeholder="Cari nama produk..."
            className="w-full rounded-xl border border-garis bg-latar px-4 py-3 outline-none focus:border-utama"
          />

          <button
            type="submit"
            className="rounded-xl bg-utama px-6 py-3 font-semibold text-white"
          >
            Cari
          </button>

          {kataKunci && (
            <Link
              href="/admin"
              className="rounded-xl border border-garis px-6 py-3 text-center font-semibold"
            >
              Reset
            </Link>
          )}
        </form>

        <p className="text-sm text-teks-lembut">
          {totalProduk} produk ditemukan
          {kataKunci ? ` untuk "${kataKunci}"` : ""}.
        </p>

        {daftarProduk && daftarProduk.length > 0 ? (
          <>
            <TabelProduk daftarProduk={daftarProduk} />

            {/* Navigasi halaman */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-teks-lembut">
                Halaman {halamanAktif} dari {Math.max(1, totalHalaman)}
              </p>

              <div className="flex items-center gap-2">
                {halamanAktif > 1 ? (
                  <Link
                    href={buatUrlHalaman(halamanAktif - 1)}
                    className="rounded-lg border border-garis px-4 py-2 hover:bg-permukaan"
                  >
                    Sebelumnya
                  </Link>
                ) : (
                  <span className="rounded-lg border border-garis px-4 py-2 opacity-40">
                    Sebelumnya
                  </span>
                )}

                {halamanAktif < totalHalaman ? (
                  <Link
                    href={buatUrlHalaman(halamanAktif + 1)}
                    className="rounded-lg border border-garis px-4 py-2 hover:bg-permukaan"
                  >
                    Berikutnya
                  </Link>
                ) : (
                  <span className="rounded-lg border border-garis px-4 py-2 opacity-40">
                    Berikutnya
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">
            {kataKunci
              ? "Produk yang kamu cari tidak ditemukan."
              : "Belum ada produk dalam katalog."}
          </p>
        )}
      </section>
    </div>
  );
}
