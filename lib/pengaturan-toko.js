import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";

export async function ambilPengaturanToko() {
  const pengaturanDefault = {
    nama: toko.nama,
    tagline: toko.tagline,
    nomorWhatsApp: toko.nomorWhatsApp,
    alamat: toko.alamat,
    jamBuka: toko.jamBuka,
  };

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("pengaturan_toko")
      .select("nama_toko, nomor_whatsapp, jam_buka, alamat")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return pengaturanDefault;
    }

    return {
      nama: data.nama_toko || toko.nama,
      tagline: toko.tagline,
      nomorWhatsApp: data.nomor_whatsapp || toko.nomorWhatsApp,
      alamat: data.alamat || toko.alamat,
      jamBuka: data.jam_buka || toko.jamBuka,
    };
  } catch (error) {
    console.error("Gagal mengambil pengaturan toko:", error);
    return pengaturanDefault;
  }
}