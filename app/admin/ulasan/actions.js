
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

export async function ubahStatusUlasan(formData) {
  await pastikanAdmin();

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID ulasan tidak valid.");
  }

  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new Error("Status ulasan tidak valid.");
  }

  const supabase = createSupabaseServerClient();

  const { data: ulasan, error: cariError } = await supabase
    .from("ulasan_produk")
    .select("produk_id")
    .eq("id", id)
    .maybeSingle();

  if (cariError) {
    console.error("Gagal mencari ulasan:", cariError);
    throw new Error("Gagal memeriksa ulasan. Silakan coba lagi.");
  }

  if (!ulasan) {
    throw new Error("Ulasan tidak ditemukan.");
  }

  const { error } = await supabase
    .from("ulasan_produk")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Gagal memperbarui status ulasan:", error);
    throw new Error("Gagal memperbarui status ulasan. Silakan coba lagi.");
  }

  revalidatePath("/admin/ulasan");
  revalidatePath(`/produk/${ulasan.produk_id}`);
}
