
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function periksaAdmin() {
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

  if (error || !user) {
    redirect("/admin/login");
  }

  return createSupabaseServerClient();
}

export async function tambahKategori(formData) {
  const supabase = await periksaAdmin();
  const nama = String(formData.get("nama") || "").trim();

  if (!nama || nama.length > 100) {
    redirect("/admin/kategori?error=Nama%20kategori%20tidak%20valid");
  }

  const { error } = await supabase
    .from("kategori")
    .insert({ nama });

  if (error) {
    console.error("Gagal menambahkan kategori:", error);

    const pesan =
      error.code === "23505"
        ? "Kategori%20sudah%20ada"
        : "Gagal%20menambahkan%20kategori.%20Silakan%20coba%20lagi";

    redirect(`/admin/kategori?error=${pesan}`);
  }

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/produk/baru");
  revalidatePath("/admin");

  redirect("/admin/kategori?success=Kategori%20berhasil%20ditambahkan");
}

export async function ubahKategori(formData) {
  const supabase = await periksaAdmin();

  const id = Number(formData.get("id"));
  const nama = String(formData.get("nama") || "").trim();

  if (!Number.isSafeInteger(id) || id <= 0 || !nama || nama.length > 100) {
    redirect("/admin/kategori?error=Data%20kategori%20tidak%20valid");
  }

  const { data: kategoriLama, error: cekKategori } = await supabase
    .from("kategori")
    .select("nama")
    .eq("id", id)
    .maybeSingle();

  if (cekKategori || !kategoriLama) {
    if (cekKategori) {
      console.error("Gagal memeriksa kategori:", cekKategori);
    }

    redirect("/admin/kategori?error=Kategori%20tidak%20ditemukan");
  }

  const namaLama = kategoriLama.nama;

  if (namaLama !== nama) {
    const { error: ubahProduk } = await supabase
      .from("produk")
      .update({ kategori: nama })
      .eq("kategori", namaLama);

    if (ubahProduk) {
      console.error("Gagal memperbarui kategori pada produk:", ubahProduk);

      redirect(
        `/admin/kategori?error=${encodeURIComponent(
          "Gagal memperbarui kategori pada produk. Silakan coba lagi."
        )}`
      );
    }
  }

  const { error } = await supabase
    .from("kategori")
    .update({ nama })
    .eq("id", id);

  if (error) {
    console.error("Gagal mengubah kategori:", error);

    // Kembalikan nama kategori produk jika perubahan kategori gagal.
    if (namaLama !== nama) {
      const { error: rollbackError } = await supabase
        .from("produk")
        .update({ kategori: namaLama })
        .eq("kategori", nama);

      if (rollbackError) {
        console.error("Gagal mengembalikan kategori produk:", rollbackError);
      }
    }

    const pesan =
      error.code === "23505"
        ? "Nama%20kategori%20sudah%20digunakan"
        : "Gagal%20mengubah%20kategori.%20Silakan%20coba%20lagi";

    redirect(`/admin/kategori?error=${pesan}`);
  }

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/produk/baru");
  revalidatePath("/admin");
  revalidatePath("/");

  redirect("/admin/kategori?success=Kategori%20berhasil%20diubah");
}

export async function hapusKategori(formData) {
  const supabase = await periksaAdmin();
  const id = Number(formData.get("id"));

  if (!Number.isSafeInteger(id) || id <= 0) {
    redirect("/admin/kategori?error=ID%20kategori%20tidak%20valid");
  }

  const { data: kategori, error: cekKategori } = await supabase
    .from("kategori")
    .select("nama")
    .eq("id", id)
    .maybeSingle();

  if (cekKategori || !kategori) {
    if (cekKategori) {
      console.error("Gagal memeriksa kategori sebelum penghapusan:", cekKategori);
    }

    redirect("/admin/kategori?error=Kategori%20tidak%20ditemukan");
  }

  const { count, error: cekProduk } = await supabase
    .from("produk")
    .select("id", { count: "exact", head: true })
    .eq("kategori", kategori.nama);

  if (cekProduk) {
    console.error("Gagal memeriksa produk dalam kategori:", cekProduk);
    redirect("/admin/kategori?error=Gagal%20memeriksa%20produk");
  }

  if (count > 0) {
    redirect(
      `/admin/kategori?error=${encodeURIComponent(
        `Kategori masih digunakan oleh ${count} produk. Ubah kategori produk terlebih dahulu.`
      )}`
    );
  }

  const { error } = await supabase
    .from("kategori")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Gagal menghapus kategori:", error);

    redirect(
      `/admin/kategori?error=${encodeURIComponent(
        "Gagal menghapus kategori. Silakan coba lagi."
      )}`
    );
  }

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/produk/baru");
  revalidatePath("/admin");

  redirect("/admin/kategori?success=Kategori%20berhasil%20dihapus");
}

export async function toggleStatusProduk(formData) {
  const supabase = await periksaAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isSafeInteger(id) || id <= 0) {
    redirect("/admin?error=ID%20produk%20tidak%20valid");
  }

  const { data: produk, error: cekProduk } = await supabase
    .from("produk")
    .select("id, aktif")
    .eq("id", id)
    .maybeSingle();

  if (cekProduk || !produk) {
    if (cekProduk) {
      console.error("Gagal memeriksa produk:", cekProduk);
    }

    redirect("/admin?error=Produk%20tidak%20ditemukan");
  }

  const { error } = await supabase
    .from("produk")
    .update({ aktif: !produk.aktif })
    .eq("id", id);

  if (error) {
    console.error("Gagal mengubah status produk:", error);

    redirect(
      `/admin?error=${encodeURIComponent(
        "Gagal mengubah status produk. Silakan coba lagi."
      )}`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);

  redirect("/admin?success=Status%20produk%20berhasil%20diubah");
}
