import NavAdmin from "@/components/NavAdmin";
import { gantiPasswordAdmin } from "../actions";

export default async function HalamanGantiPassword({ searchParams }) {
  const params = await searchParams;
  const pesanError = params?.error;
  const pesanSukses = params?.success;

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <h1 className="text-2xl font-extrabold">Ganti password</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Ganti password bawaan. Minimal 8 karakter.
        </p>
      </div>

      {pesanError && (
        <p role="alert" className="rounded-lg border border-bahaya/30 bg-bahaya/5 p-3 text-sm text-bahaya">
          {pesanError}
        </p>
      )}

      {pesanSukses && (
        <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {pesanSukses}
        </p>
      )}

      <form action={gantiPasswordAdmin} className="flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Password baru
          <input
            type="password"
            name="password_baru"
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-lg border border-garis px-3 py-3"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Ulangi password baru
          <input
            type="password"
            name="konfirmasi_password"
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-lg border border-garis px-3 py-3"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap"
        >
          Simpan password baru
        </button>
      </form>
    </div>
  );
}
