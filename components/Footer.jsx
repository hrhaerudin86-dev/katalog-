import Link from "next/link";

export default function Footer({ pengaturan }) {
  return (
    <footer className="mt-16 border-t border-garis bg-permukaan">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-teks-lembut sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-bold text-teks">
            {pengaturan?.nama || "SIRKULA"}
          </p>

          <p>{pengaturan?.alamat || "-"}</p>

          <p>{pengaturan?.jamBuka || "-"}</p>

          <Link
            href="/tentang"
            className="underline underline-offset-4 hover:text-utama"
          >
            Tentang Kami
          </Link>
        </div>

        <Link
          href="/admin"
          className="self-start underline underline-offset-4 hover:text-utama"
        >
          Masuk sebagai admin
        </Link>
      </div>
    </footer>
  );
}