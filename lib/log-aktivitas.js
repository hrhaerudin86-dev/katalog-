import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function catatAktivitasAdmin({
  admin,
  aksi,
  produkId = null,
  namaProduk,
}) {
  try {
    if (!admin?.id || !admin?.email) {
      console.error("Data admin tidak lengkap untuk pencatatan aktivitas.");
      return;
    }

    const aksiValid = [
      "tambah_produk",
      "ubah_produk",
      "hapus_produk",
    ];

    if (!aksiValid.includes(aksi)) {
      console.error("Jenis aktivitas tidak valid:", aksi);
      return;
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("log_aktivitas_admin")
      .insert({
        admin_id: admin.id,
        admin_email: admin.email,
        aksi,
        produk_id: produkId,
        nama_produk: namaProduk,
      });

    if (error) {
      console.error("Gagal mencatat aktivitas admin:", error.message);
    }
  } catch (error) {
    console.error("Kesalahan pencatatan aktivitas:", error);
  }
}