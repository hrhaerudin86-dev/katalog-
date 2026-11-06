
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function pastikanAdmin() {
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
}

export async function simpanPengaturanToko(formData) {
  await pastikanAdmin();

  const nama_toko = String(formData.get("nama_toko") || "").trim();
  const nomor_whatsapp = String(
    formData.get("nomor_whatsapp") || ""
  ).replace(/\D/g, "");
  const jam_buka = String(formData.get("jam_buka") || "").trim();
  const alamat = String(formData.get("alamat") || "").trim();

  if (!nama_toko || nama_toko.length > 100) {
    throw new Error("Nama toko wajib diisi, maksimal 100 karakter.");
  }

  if (!/^62[0-9]{8,13}$/.test(nomor_whatsapp)) {
    throw new Error(
      "Nomor WhatsApp harus diawali 62 dan berisi 10–15 digit."
    );
  }

  if (!jam_buka || jam_buka.length > 150) {
    throw new Error("Jam buka wajib diisi, maksimal 150 karakter.");
  }

  if (!alamat || alamat.length > 500) {
    throw new Error("Alamat wajib diisi, maksimal 500 karakter.");
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("pengaturan_toko")
    .upsert(
      {
        id: 1,
        nama_toko,
        nomor_whatsapp,
        jam_buka,
        alamat,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Gagal menyimpan pengaturan toko:", error);
    throw new Error("Gagal menyimpan pengaturan toko. Silakan coba lagi.");
  }

  revalidatePath("/");
  revalidatePath("/tentang");
  revalidatePath("/admin");
  revalidatePath("/admin/pengaturan");

  redirect("/admin/pengaturan");
}
