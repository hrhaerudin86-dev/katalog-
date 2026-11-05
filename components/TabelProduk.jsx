
import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import TombolHapus from "@/components/TombolHapus";
import {
  hapusProdukAdmin,
  toggleStatusProduk,
} from "@/app/admin/actions";
import { ubahUrutanProduk } from "@/app/admin/urutan/actions";

export default function TabelProduk({ daftarProduk }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-garis">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-permukaan text-teks-lembut">
          <tr>
            <th className="px-4 py-3 font-semibold">Urutan</th>
            <th className="px-4 py-3 font-semibold">Produk</th>
            <th className="px-4 py-3 font-semibold">Kategori</th>
            <th className="px-4 py-3 font-semibold">Harga</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {daftarProduk.map((produk) => (
            <tr key={produk.id} className="border-t border-garis">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="min-w-6 text-center font-semibold">
                    {produk.urutan ?? "—"}
                  </span>

                  <div className="flex gap-1">
                    <form action={ubahUrutanProduk}>
                      <input
                        type="hidden"
                        name="id"
                        value={produk.id}
                      />
                      <input
                        type="hidden"
                        name="arah"
                        value="naik"
                      />
                      <button
                        type="submit"
                        title="Naikkan posisi"
                        aria-label={`Naikkan posisi ${produk.nama}`}
                        className="rounded-md border border-garis px-2 py-1 font-bold hover:bg-permukaan"
                      >
                        ↑
                      </button>
                    </form>

                    <form action={ubahUrutanProduk}>
                      <input
                        type="hidden"
                        name="id"
                        value={produk.id}
                      />
                      <input
                        type="hidden"
                        name="arah"
                        value="turun"
                      />
                      <button
                        type="submit"
                        title="Turunkan posisi"
                        aria-label={`Turunkan posisi ${produk.nama}`}
                        className="rounded-md border border-garis px-2 py-1 font-bold hover:bg-permukaan"
                      >
                        ↓
                      </button>
                    </form>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {produk.foto_url ? (
                    <img
                      src={produk.foto_url}
                      alt={`Foto ${produk.nama}`}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-permukaan text-xs text-teks-lembut"
                      aria-label="Foto belum tersedia"
                    >
                      Foto
                    </div>
                  )}

                  <span className="font-semibold">{produk.nama}</span>
                </div>
              </td>

              <td className="px-4 py-3 text-teks-lembut">
                {produk.kategori}
              </td>

              <td className="px-4 py-3">
                {formatRupiah(produk.harga)}
              </td>

              <td className="px-4 py-3">
                <span
                  className={
                    produk.aktif
                      ? "font-semibold text-green-700"
                      : "font-semibold text-red-600"
                  }
                >
                  {produk.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <form action={toggleStatusProduk}>
                    <input
                      type="hidden"
                      name="id"
                      value={produk.id}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-garis px-3 py-2 font-semibold hover:bg-permukaan"
                    >
                      {produk.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>

                  <Tombol
                    href={`/admin/produk/${produk.id}/ubah`}
                    varian="garis"
                  >
                    Ubah
                  </Tombol>

                  <TombolHapus
                    action={hapusProdukAdmin.bind(null, produk.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
