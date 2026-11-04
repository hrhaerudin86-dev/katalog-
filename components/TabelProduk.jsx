
import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import TombolHapus from "@/components/TombolHapus";
import {
  hapusProdukAdmin,
  toggleStatusProduk,
} from "@/app/admin/actions";

export default function TabelProduk({ daftarProduk }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-garis">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-permukaan text-teks-lembut">
          <tr>
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
                <div className="flex items-center gap-3">
                  <img
                    src={produk.foto_url}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
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
