import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toko } from "@/lib/toko";
import { KeranjangProvider } from "@/components/KeranjangProvider";

export const metadata = {
  metadataBase: new URL("https://katalog-bay-psi.vercel.app"),

  title: {
    default: `${toko.nama} | Katalog Produk UMKM`,
    template: `%s | ${toko.nama}`,
  },

  description:
    "SIRKULA adalah katalog produk UMKM kreatif yang mengubah limbah menjadi produk bernilai dan bermanfaat.",

  applicationName: "SIRKULA",

  keywords: [
    "SIRKULA",
    "UMKM",
    "katalog produk",
    "produk daur ulang",
    "kerajinan limbah",
    "produk ramah lingkungan",
  ],

  authors: [{ name: "SIRKULA" }],
  creator: "SIRKULA",
  publisher: "SIRKULA",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: `${toko.nama} | Katalog Produk UMKM`,
    description:
      "Dari Limbah Menjadi Berkah. Temukan produk kreatif dan ramah lingkungan dari SIRKULA.",
    url: "https://katalog-bay-psi.vercel.app",
    siteName: "SIRKULA",
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: `${toko.nama} | Katalog Produk UMKM`,
    description:
      "Dari Limbah Menjadi Berkah. Temukan produk kreatif SIRKULA.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIRKULA",
  },
};

export const viewport = {
  themeColor: "#176b4d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <KeranjangProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4">
            {children}
          </main>
          <Footer />
        </KeranjangProvider>
      </body>
    </html>
  );
}