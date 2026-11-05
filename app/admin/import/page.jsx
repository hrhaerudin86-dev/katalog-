
"use client";

import { useState } from "react";
import { importProdukCSV } from "./actions";
import NavAdmin from "@/components/NavAdmin";

export default function ImportProdukPage() {
  const [file, setFile] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const [hasil, setHasil] = useState(null);

  async function prosesImport(event) {
    event.preventDefault();

    if (!file) {
      setHasil({
        success: false,
        pesan: "Pilih file CSV terlebih dahulu.",
        berhasil: 0,
        gagal: [],
      });
      return;
    }

    setMemuat(true);
    setHasil(null);

    try {
      const formData = new FormData();
      formData.append("file_csv", file);

      const respons = await importProdukCSV(formData);
      setHasil(respons);

      if (respons.success) {
        setFile(null);
        event.target.reset();
      }
    } catch {
      setHasil({
        success: false,
        pesan: "Terjadi kesalahan saat menjalankan import.",
        berhasil: 0,
        gagal: [],
      });
    } finally {
      setMemuat(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-utama">PANEL ADMIN</p>
        <h1 className="text-2xl font-bold">Import Produk CSV</h1>
        <p className="text-sm text-teks-lembut">
          Tambahkan banyak produk sekaligus menggunakan file CSV.
        </p>
      </header>

      <NavAdmin />

      <section className="max-w-3xl space-y-5 rounded-xl border border-garis p-5">
        <div>
          <h2 className="font-semibold">Upload File CSV</h2>
          <p className="mt-1 text-sm text-teks-lembut">
            Format CSV standar dengan pemisah koma. Maksimal ukuran file 2 MB.
          </p>
        </div>

        <div className="rounded-lg bg-latar p-4 text-sm">
          <p className="mb-2 font-semibold">Kolom CSV:</p>
          <p className="break-words">
            nama,harga,kategori,harga_diskon,badge,stok,foto_url,foto_galeri,deskripsi
          </p>
          <p className="mt-2 text-xs text-teks-lembut">
            Kolom wajib: nama, harga, kategori. Kolom lainnya boleh dikosongkan.
            Untuk beberapa URL foto galeri, pisahkan dengan tanda |.
          </p>
        </div>

        <form onSubmit={prosesImport} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="file_csv" className="text-sm font-medium">
              Pilih file CSV
            </label>

            <input
              id="file_csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setHasil(null);
              }}
              className="w-full rounded-lg border border-garis bg-latar p-3 text-sm"
            />

            {file && (
              <p className="text-sm text-teks-lembut">
                File dipilih: {file.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || memuat}
            className="rounded-lg bg-utama px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {memuat ? "Sedang mengimpor..." : "Import Produk"}
          </button>
        </form>
      </section>

      {hasil && (
        <section className="max-w-4xl space-y-4 rounded-xl border border-garis p-5">
          <h2 className="text-lg font-bold">Hasil Import</h2>

          <p className="text-sm">{hasil.pesan}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-garis p-4">
              <p className="text-sm text-teks-lembut">Berhasil</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {hasil.berhasil}
              </p>
            </div>

            <div className="rounded-lg border border-garis p-4">
              <p className="text-sm text-teks-lembut">Gagal</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {hasil.gagal?.length || 0}
              </p>
            </div>
          </div>

          {hasil.gagal?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Detail Baris yang Gagal</h3>

              <div className="overflow-x-auto rounded-lg border border-garis">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead className="bg-latar">
                    <tr>
                      <th className="px-4 py-3">Baris CSV</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3">Penyebab</th>
                    </tr>
                  </thead>

                  <tbody>
                    {hasil.gagal.map((item, index) => (
                      <tr key={`${item.nomorBaris}-${index}`} className="border-t border-garis">
                        <td className="px-4 py-3">{item.nomorBaris}</td>
                        <td className="px-4 py-3">{item.nama || "-"}</td>
                        <td className="px-4 py-3 text-red-600">
                          {item.alasan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
