import Link from "next/link";

export const metadata = {
  title: "Admin SIRKULA",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col">
      <nav className="border-b border-garis bg-permukaan px-4 py-2.5 text-xs font-semibold">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
          <span className="rounded bg-utama px-2 py-0.5 text-white">PANEL SIRKULA</span>
          <Link href="/admin" className="hover:text-utama">
            Katalog & Produk
          </Link>
          <Link href="/admin/operasional" className="hover:text-utama">
            Operasional, Toko & Payout
          </Link>
          <Link href="/admin/artikel" className="hover:text-utama">
            Kelola Artikel (CMS)
          </Link>
          <Link href="/penjual/dashboard" className="ml-auto text-teks-lembut hover:text-utama">
            Lihat Dashboard Penjual →
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}