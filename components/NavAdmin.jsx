
import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function NavAdmin() {
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-garis pb-4 text-sm">
      <Link href="/admin" className="font-semibold hover:text-utama">
        Dashboard & Produk
      </Link>

      <Link href="/admin/kategori" className="font-semibold hover:text-utama">
        Kelola Kategori
      </Link>

      <Link href="/admin/ulasan" className="font-semibold hover:text-utama">
        Moderasi Ulasan
      </Link>

      <Link href="/admin/banner" className="font-semibold hover:text-utama">
        Kelola Banner
      </Link>

      <Link href="/admin/pengaturan" className="font-semibold hover:text-utama">
        Pengaturan Toko
      </Link>

      <Link href="/admin/akun" className="font-semibold hover:text-utama">
        Kelola Akun Admin
      </Link>

      <Link href="/admin/log-aktivitas" className="font-semibold hover:text-utama">
        Log Aktivitas
      </Link>

      <Link href="/admin/password" className="font-semibold hover:text-utama">
        Ganti password
      </Link>

      <form action={logoutAdmin} className="ml-auto">
        <button type="submit" className="text-teks-lembut hover:text-bahaya">
          Keluar
        </button>
      </form>
    </nav>
  );
}
