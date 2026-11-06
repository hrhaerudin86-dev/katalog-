
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BATAS_ULASAN = 3;
const JENDELA_ULASAN = 10 * 60 * 1000;
const percobaanUlasan = new Map();

function cekRateLimit(ip) {
  const sekarang = Date.now();
  const data = percobaanUlasan.get(ip);

  if (!data || sekarang - data.waktu >= JENDELA_ULASAN) {
    percobaanUlasan.set(ip, {
      jumlah: 0,
      waktu: sekarang,
    });
    return true;
  }

  return data.jumlah < BATAS_ULASAN;
}

function catatUlasan(ip) {
  const data = percobaanUlasan.get(ip);

  if (data) {
    data.jumlah += 1;
  }
}

export async function kirimUlasan(produkId, formData) {
  const nama = String(formData.get("nama") || "").trim();
  const rating = Number(formData.get("rating"));
  const komentar = String(formData.get("komentar") || "").trim();

  if (!nama || nama.length > 80) {
    redirect(`/produk/${produkId}?ulasan=nama`);
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/produk/${produkId}?ulasan=rating`);
  }

  if (!komentar || komentar.length > 1000) {
    redirect(`/produk/${produkId}?ulasan=komentar`);
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-real-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (!cekRateLimit(ip)) {
    redirect(`/produk/${produkId}?ulasan=terlalu_banyak`);
  }

  catatUlasan(ip);

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("ulasan_produk").insert({
    produk_id: produkId,
    nama_pengulas: nama,
    rating,
    komentar,
    status: "pending",
  });

  if (error) {
    console.error("Gagal menyimpan ulasan:", error);
    redirect(`/produk/${produkId}?ulasan=gagal`);
  }

  revalidatePath(`/produk/${produkId}`);
  redirect(`/produk/${produkId}?ulasan=menunggu`);
}
