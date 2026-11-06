
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
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }
}

function validasiData(formData) {
  const produkId = Number(formData.get("produk_id"));
  const namaVarian = String(
    formData.get("nama_varian") || ""
  ).trim();
  const nilaiHarga = String(formData.get("harga") || "").trim();
  const harga = Number(nilaiHarga);

  if (!Number.isSafeInteger(produkId) || produkId <= 0) {
    return { error: "ID produk tidak valid." };
  }

  if (!namaVarian) {
    return { error: "Nama varian wajib diisi." };
  }

  if (namaVarian.length > 100) {
    return { error: "Nama varian maksimal 100 karakter." };
  }

  if (
    nilaiHarga === "" ||
    !Number.isSafeInteger(harga) ||
    harga < 0
  ) {
    return { error: "Harga varian harus berupa angka minimal 0." };
  }

  return {
    produkId,
    namaVarian,
    harga,
    error: null,
  };
}

export async function tambahVarianProduk(formData) {
  await periksaAdmin();

  const hasil = validasiData(formData);

  if (hasil.error) {
    redirect(
      `/admin/produk/${hasil.produkId || ""}/ubah?errorVarian=${encodeURIComponent(hasil.error)}`
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: produk, error: errorProduk } = await supabase
    .from("produk")
    .select("id")
    .eq("id", hasil.produkId)
    .maybeSingle();

  if (errorProduk || !produk) {
    if (errorProduk) {
      console.error("Gagal memeriksa produk sebelum menambahkan varian:", errorProduk);
    }

    redirect("/admin?error=Produk%20tidak%20ditemukan");
  }

  const { error } = await supabase
    .from("produk_varian")
    .insert({
      produk_id: hasil.produkId,
      nama_varian: hasil.namaVarian,
      harga: hasil.harga,
    });

  if (error) {
    console.error("Gagal menambahkan varian produk:", error);

    const pesan =
      error.code === "23505"
        ? "Nama varian tersebut sudah digunakan."
        : "Gagal menambahkan varian. Silakan coba lagi.";

    redirect(
      `/admin/produk/${hasil.produkId}/ubah?errorVarian=${encodeURIComponent(pesan)}`
    );
  }

  revalidatePath(`/admin/produk/${hasil.produkId}/ubah`);
  revalidatePath(`/produk/${hasil.produkId}`);

  redirect(
    `/admin/produk/${hasil.produkId}/ubah?successVarian=Varian%20berhasil%20ditambahkan`
  );
}

export async function ubahVarianProduk(formData) {
  await periksaAdmin();

  const varianId = Number(formData.get("varian_id"));
  const hasil = validasiData(formData);

  if (!Number.isSafeInteger(varianId) || varianId <= 0) {
    redirect("/admin?error=ID%20varian%20tidak%20valid");
  }

  if (hasil.error) {
    redirect(
      `/admin/produk/${hasil.produkId || ""}/ubah?errorVarian=${encodeURIComponent(hasil.error)}`
    );
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("produk_varian")
    .update({
      nama_varian: hasil.namaVarian,
      harga: hasil.harga,
    })
    .eq("id", varianId)
    .eq("produk_id", hasil.produkId);

  if (error) {
    console.error("Gagal mengubah varian produk:", error);

    const pesan =
      error.code === "23505"
        ? "Nama varian tersebut sudah digunakan."
        : "Gagal memperbarui varian. Silakan coba lagi.";

    redirect(
      `/admin/produk/${hasil.produkId}/ubah?errorVarian=${encodeURIComponent(pesan)}`
    );
  }

  revalidatePath(`/admin/produk/${hasil.produkId}/ubah`);
  revalidatePath(`/produk/${hasil.produkId}`);

  redirect(
    `/admin/produk/${hasil.produkId}/ubah?successVarian=Varian%20berhasil%20diperbarui`
  );
}

export async function hapusVarianProduk(formData) {
  await periksaAdmin();

  const varianId = Number(formData.get("varian_id"));
  const produkId = Number(formData.get("produk_id"));

  if (
    !Number.isSafeInteger(varianId) ||
    varianId <= 0 ||
    !Number.isSafeInteger(produkId) ||
    produkId <= 0
  ) {
    redirect("/admin?error=Data%20varian%20tidak%20valid");
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("produk_varian")
    .delete()
    .eq("id", varianId)
    .eq("produk_id", produkId);

  if (error) {
    console.error("Gagal menghapus varian produk:", error);

    redirect(
      `/admin/produk/${produkId}/ubah?errorVarian=${encodeURIComponent(
        "Gagal menghapus varian. Silakan coba lagi."
      )}`
    );
  }

  revalidatePath(`/admin/produk/${produkId}/ubah`);
  revalidatePath(`/produk/${produkId}`);

  redirect(
    `/admin/produk/${produkId}/ubah?successVarian=Varian%20berhasil%20dihapus`
  );
}
