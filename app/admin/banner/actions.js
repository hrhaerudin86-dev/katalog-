
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

export async function simpanBanner(formData) {
  await pastikanAdmin();

  const id = Number(formData.get("id") || 0);
  const judul = String(formData.get("judul") || "").trim();
  const teks = String(formData.get("teks") || "").trim();
  const gambar_url = String(formData.get("gambar_url") || "").trim();
  const tautan = String(formData.get("tautan") || "").trim();

  if (!judul || judul.length > 150) {
    throw new Error("Judul wajib diisi dan maksimal 150 karakter.");
  }

  if (teks.length > 1000 || gambar_url.length > 2000 || tautan.length > 2000) {
    throw new Error("Teks, URL gambar, atau tautan terlalu panjang.");
  }

  for (const url of [gambar_url, tautan].filter(Boolean)) {
    let parsed;

    try {
      parsed = new URL(url);
    } catch {
      throw new Error("URL gambar dan tautan harus berupa URL yang valid.");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL hanya boleh menggunakan HTTP atau HTTPS.");
    }
  }

  const supabase = createSupabaseServerClient();

  const dataBanner = {
    judul,
    teks: teks || null,
    gambar_url: gambar_url || null,
    tautan: tautan || null,
  };

  if (id > 0) {
    const { error } = await supabase
      .from("banner_promo")
      .update({
        ...dataBanner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error("Gagal mengubah banner.");
  } else {
    const { error } = await supabase
      .from("banner_promo")
      .insert(dataBanner);

    if (error) throw new Error("Gagal menambahkan banner.");
  }

  revalidatePath("/admin/banner");
  revalidatePath("/");

  redirect("/admin/banner");
}

export async function ubahStatusBanner(formData) {
  await pastikanAdmin();

  const id = Number(formData.get("id"));
  const aktif = formData.get("aktif") === "true";

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID banner tidak valid.");
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("banner_promo")
    .update({
      aktif,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error("Gagal mengubah status banner.");

  revalidatePath("/admin/banner");
  revalidatePath("/");
}
