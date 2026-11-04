
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("ulasan_produk")
    .insert({
      produk_id: produkId,
      nama_pengulas: nama,
      rating,
      komentar,
    });

  if (error) {
    console.error("Gagal menyimpan ulasan:", error);
    redirect(`/produk/${produkId}?ulasan=gagal`);
  }

  revalidatePath(`/produk/${produkId}`);
  redirect(`/produk/${produkId}?ulasan=berhasil`);
}
