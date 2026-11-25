import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HalamanMasukPembeli({ searchParams }) {
  const params = await searchParams;
  const nextUrl = params?.next || "/checkout";
  const pesanError = params?.error || "";
  const mode = params?.mode === "daftar" ? "daftar" : "masuk";

  async function authAction(formData) {
    "use server";

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const tipe = String(formData.get("tipe") || "masuk");
    const tujuan = String(formData.get("next") || "/checkout");

    if (!email || !password) {
      redirect(`/akun/masuk?mode=${tipe}&next=${encodeURIComponent(tujuan)}&error=Email+dan+password+wajib+diisi`);
    }

    const supabase = createSupabaseServerClient();
    let session = null;

    if (tipe === "daftar") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        redirect(`/akun/masuk?mode=daftar&next=${encodeURIComponent(tujuan)}&error=${encodeURIComponent(error.message)}`);
      }
      session = data?.session;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        redirect(`/akun/masuk?mode=masuk&next=${encodeURIComponent(tujuan)}&error=${encodeURIComponent(error.message)}`);
      }
      session = data?.session;
    }

    if (!session?.access_token) {
      redirect(`/akun/masuk?mode=masuk&next=${encodeURIComponent(tujuan)}&error=Akun+terbuat,+silakan+login`);
    }

    const cookieStore = await cookies();
    cookieStore.set("sirkula_buyer_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(tujuan);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <Link href="/" className="text-sm text-teks-lembut hover:text-utama">
        ← Kembali ke Beranda
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold">
          {mode === "daftar" ? "Daftar Akun Pembeli" : "Masuk untuk Checkout"}
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Autentikasi diperlukan agar pesanan dan pengiriman Anda dapat dipantau.
        </p>
      </div>

      {pesanError && (
        <div className="rounded-xl border border-bahaya/30 bg-bahaya/5 p-3.5 text-sm text-bahaya">
          {pesanError}
        </div>
      )}

      <form action={authAction} className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6">
        <input type="hidden" name="tipe" value={mode} />
        <input type="hidden" name="next" value={nextUrl} />

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="pembeli@email.com"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Password (minimal 6 karakter)
          <input
            name="password"
            type="password"
            minLength={6}
            required
            placeholder="••••••••"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          {mode === "daftar" ? "Buat Akun & Lanjut" : "Masuk & Lanjut"}
        </button>
      </form>

      <p className="text-center text-sm text-teks-lembut">
        {mode === "daftar" ? (
          <>
            Sudah punya akun?{" "}
            <Link href={`/akun/masuk?mode=masuk&next=${encodeURIComponent(nextUrl)}`} className="font-semibold text-utama hover:underline">
              Masuk di sini
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link href={`/akun/masuk?mode=daftar&next=${encodeURIComponent(nextUrl)}`} className="font-semibold text-utama hover:underline">
              Daftar sekarang
            </Link>
          </>
        )}
      </p>
    </div>
  );
}