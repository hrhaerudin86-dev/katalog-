"use client";

import Link from "next/link";
import { toko } from "@/lib/toko";
import { useKeranjang } from "@/components/KeranjangProvider";
import TombolMode from "@/components/TombolMode";

export default function Header() {
  const { jumlahItem, siap } = useKeranjang();

  return (
    <header className="border-b border-garis bg-latar">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-utama"
        >
          {toko.nama}
        </Link>

        <div className="flex items-center gap-2">
          <TombolMode />

          <Link
            href="/keranjang"
            className="flex items-center gap-2 rounded-xl border border-garis px-4 py-2 font-semibold text-utama transition hover:bg-permukaan"
          >
            <span>Keranjang</span>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-utama px-1.5 text-xs font-bold text-white">
              {siap ? jumlahItem : 0}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}