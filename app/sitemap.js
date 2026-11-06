
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE_URL = "https://katalog-bay-psi.vercel.app";

export default async function sitemap() {
  const supabase = await createSupabaseServerClient();

  const { data: produk, error } = await supabase
    .from("produk")
    .select("id, created_at");

  if (error) {
    console.error("Gagal mengambil data sitemap:", error);
    throw new Error("Gagal memuat sitemap.");
  }

  const halamanUtama = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tentang`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const halamanProduk = (produk ?? []).map((item) => ({
    url: `${BASE_URL}/produk/${item.id}`,
    lastModified: item.created_at
      ? new Date(item.created_at)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...halamanUtama, ...halamanProduk];
}
