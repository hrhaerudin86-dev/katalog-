
"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BATAS_KLIK = 10;
const JENDELA_KLIK = 60 * 1000;
const riwayatKlik = new Map();

function cekBatasKlik(ip) {
  const sekarang = Date.now();
  const data = riwayatKlik.get(ip);

  if (!data || sekarang - data.waktu >= JENDELA_KLIK) {
    riwayatKlik.set(ip, {
      jumlah: 0,
      waktu: sekarang,
    });
    return true;
  }

  return data.jumlah < BATAS_KLIK;
}

function catatBatasKlik(ip) {
  const data = riwayatKlik.get(ip);
  if (data) data.jumlah += 1;
}

export async function catatKlikWhatsApp(produkId) {
  try {
    const id = Number(produkId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return { success: false };
    }

    const headerStore = await headers();
    const ip =
      headerStore.get("x-real-ip") ||
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (!cekBatasKlik(ip)) {
      return { success: false, rateLimited: true };
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

    catatBatasKlik(ip);

    return { success: true };
  } catch (error) {
    console.error("Kesalahan pencatatan klik WhatsApp:", error);
    return { success: false };
  }
}
