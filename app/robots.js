import { toko } from "@/lib/toko";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: "https://katalog-bay-psi.vercel.app/sitemap.xml",
    host: "https://katalog-bay-psi.vercel.app",
  };
}