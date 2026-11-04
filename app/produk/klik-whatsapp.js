
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function catatKlikWhatsApp(produkId) {
  try {
    const id = Number(produkId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return { success: false };
    }

    const supabase = await createSupabaseServerClient();

    const { data: produk, error: errorProduk } = await supabase
      .from("produk")
      .select("id")
      .eq("id", id)
      .eq("aktif", true)
      .maybeSingle();

    if (errorProduk || !produk) {
      return { success: false };
    }

    const { error } = await supabase
      .from("klik_whatsapp")
      .insert({ produk_id: id });

    if (error) {
      console.error("Gagal mencatat klik WhatsApp:", error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Kesalahan pencatatan klik WhatsApp:", error);
    return { success: false };
  }
}
