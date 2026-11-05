
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
          } catch {}
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

export async function ubahUrutanProduk(formData) {
  await periksaAdmin();

  const id = Number(formData.get("id"));
  const arah = String(formData.get("arah") || "");

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !["naik", "turun"].includes(arah)
  ) {
    redirect("/admin?error=Data%20urutan%20tidak%20valid");
  }

  const supabase = createSupabaseServerClient();

  const { data: daftar, error } = await supabase
    .from("produk")
    .select("id, urutan, created_at")
    .order("urutan", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (error || !daftar) {
    redirect("/admin?error=Gagal%20mengambil%20urutan%20produk");
  }

  // Cari posisi produk yang dipilih
  const posisi = daftar.findIndex(
    (item) => Number(item.id) === id
  );

  if (posisi === -1) {
    redirect("/admin?error=Produk%20tidak%20ditemukan");
  }

  // Tentukan posisi tujuan
  const posisiBaru = arah === "naik" ? posisi - 1 : posisi + 1;

  if (posisiBaru < 0 || posisiBaru >= daftar.length) {
    redirect("/admin");
  }

  // Tukar posisi produk
  const daftarBaru = [...daftar];

  [daftarBaru[posisi], daftarBaru[posisiBaru]] = [
    daftarBaru[posisiBaru],
    daftarBaru[posisi],
  ];

  // Simpan ulang seluruh nomor urut agar selalu konsisten
  for (let index = 0; index < daftarBaru.length; index++) {
    const produk = daftarBaru[index];

    const { error: errorUpdate } = await supabase
      .from("produk")
      .update({ urutan: index + 1 })
      .eq("id", produk.id);

    if (errorUpdate) {
      console.error("Gagal menyimpan urutan produk:", errorUpdate);

      redirect(
        "/admin?error=Gagal%20menyimpan%20urutan%20produk"
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");

  redirect("/admin?success=Urutan%20produk%20berhasil%20diubah");
}
