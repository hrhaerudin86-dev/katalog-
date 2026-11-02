
export default function manifest() {
  return {
    name: "SIRKULA - Dari Limbah Menjadi Berkah",
    short_name: "SIRKULA",
    description: "Katalog produk kreatif ramah lingkungan.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#176b4d",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
