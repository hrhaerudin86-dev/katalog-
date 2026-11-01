import { loginAdmin } from "../actions";

export default async function HalamanLogin({ searchParams }) {
  const params = await searchParams;
  const pesanError = params?.error;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold">Masuk admin</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Khusus pemilik toko untuk mengelola produk.
        </p>
      </div>

      {pesanError && (
        <p role="alert" className="rounded-lg border border-bahaya/30 bg-bahaya/5 p-3 text-sm text-bahaya">
          {pesanError}
        </p>
      )}

      <form action={loginAdmin} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input type="email" name="email" autoComplete="username" required className="rounded-lg border border-garis px-3 py-3" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Password
          <input type="password" name="password" autoComplete="current-password" required className="rounded-lg border border-garis px-3 py-3" />
        </label>

        <button type="submit" className="rounded-lg bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap">
          Masuk
        </button>
      </form>
    </div>
  );
}
