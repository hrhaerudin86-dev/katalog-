
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function amankanCSV(nilai) {
  if (nilai === null || nilai === undefined) {
    return '""';
  }

  let teks = String(nilai);

  // Mencegah CSV Formula Injection pada data teks
  if (/^[\s]*[=+\-@]/.test(teks)) {
    teks = "'" + teks;
  }

  return `"${teks.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
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
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login sebagai admin." },
        { status: 401 }
      );
    }

    // Ambil seluruh produk dari database
    const supabase = createSupabaseServerClient();

    const { data: produk, error } = await supabase
      .from("produk")
      .select(
        "id, nama, kategori, harga, harga_diskon, badge, stok, aktif, foto_url, deskripsi, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengekspor produk:", error.message);

      return NextResponse.json(
        { error: "Gagal mengambil data produk." },
        { status: 500 }
      );
    }

    const header = [
      "ID",
      "Nama Produk",
      "Kategori",
      "Harga Normal",
      "Harga Diskon",
      "Badge",
      "Stok",
      "Status",
      "Foto Utama",
      "Deskripsi",
      "Tanggal Dibuat",
    ];

    const baris = (produk ?? []).map((item) => [
      amankanCSV(item.id),
      amankanCSV(item.nama),
      amankanCSV(item.kategori),
      amankanCSV(item.harga),
      amankanCSV(item.harga_diskon),
      amankanCSV(item.badge),
      amankanCSV(item.stok),
      amankanCSV(item.aktif ? "Aktif" : "Nonaktif"),
      amankanCSV(item.foto_url),
      amankanCSV(item.deskripsi),
      amankanCSV(item.created_at),
    ]);

    const isiCSV = [
      header.map(amankanCSV).join(","),
      ...baris.map((barisProduk) => barisProduk.join(",")),
    ].join("\r\n");

    // BOM agar karakter Indonesia terbaca dengan baik di Excel
    const csv = "\uFEFF" + isiCSV;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="produk-sirkula.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Kesalahan ekspor CSV:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengekspor produk." },
      { status: 500 }
    );
  }
}
