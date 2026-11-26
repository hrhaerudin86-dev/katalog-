import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function KelolaProdukPenjual() {
  await requireRole(["seller", "admin"], "/penjual/produk");

  const supabase = await createSupabaseServerClient();
  const { data: daftarProduk } = await supabase
    .from("produk")
    .select("id, nama, harga, harga_diskon, badge, stok, deskripsi, foto_url, kategori, aktif, created_at")
    .order("created_at", { ascending: false });

  const kategoriTersedia = [
    ...new Set((daftarProduk ?? []).map((p) => p.kategori).filter(Boolean)),
  ];

  async function tambahProdukAction(formData) {
    "use server";
    await requireRole(["seller", "admin"], "/penjual/produk");

    const nama = String(formData.get("nama") || "").trim();
    const kategori = String(formData.get("kategori") || "Plastik").trim();
    const harga = Number(formData.get("harga") || 0);
    const hargaDiskonRaw = String(formData.get("harga_diskon") || "").trim();
    const hargaDiskon = hargaDiskonRaw ? Number(hargaDiskonRaw) : null;
    const stok = Math.max(0, Number(formData.get("stok") || 0));
    const badge = String(formData.get("badge") || "").trim() || null;
    const fotoUrl = String(formData.get("foto_url") || "").trim() || null;
    const deskripsi = String(formData.get("deskripsi") || "").trim();
    const aktif = formData.get("aktif") === "on";

    if (!nama || harga <= 0) return;

    const db = await createSupabaseServerClient();
    await db.from("produk").insert({
      nama,
      kategori,
      harga,
      harga_diskon: hargaDiskon && hargaDiskon > 0 ? hargaDiskon : null,
      stok,
      badge,
      foto_url: fotoUrl,
      deskripsi,
      aktif,
    });

    revalidatePath("/penjual/produk");
    revalidatePath("/");
  }

  async function updateStokAction(formData) {
    "use server";
    await requireRole(["seller", "admin"], "/penjual/produk");

    const id = String(formData.get("id") || "");
    const stokBaru = Math.max(0, Number(formData.get("stok") || 0));
    if (!id) return;

    const db = await createSupabaseServerClient();
    await db.from("produk").update({ stok: stokBaru }).eq("id", id);

    revalidatePath("/penjual/produk");
    revalidatePath("/");
  }

  async function toggleAktifAction(formData) {
    "use server";
    await requireRole(["seller", "admin"], "/penjual/produk");

    const id = String(formData.get("id") || "");
    const aktifBaru = formData.get("aktif_baru") === "true";
    if (!id) return;

    const db = await createSupabaseServerClient();
    await db.from("produk").update({ aktif: aktifBaru }).eq("id", id);

    revalidatePath("/penjual/produk");
    revalidatePath("/");
  }

  async function hapusProdukAction(formData) {
    "use server";
    await requireRole(["seller", "admin"], "/penjual/produk");

    const id = String(formData.get("id") || "");
    if (!id) return;

    const db = await createSupabaseServerClient();
    await db.from("produk").delete().eq("id", id);

    revalidatePath("/penjual/produk");
    revalidatePath("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Kelola Produk & Stok Penjual</h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Tambah listing material sisa/daur ulang, perbarui stok, atau arsipkan produk dari katalog.
          </p>
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          <Link href="/penjual/dashboard" className="text-utama hover:underline">
            Dashboard & Resi
          </Link>
          <Link href="/" className="text-teks-lembut hover:text-utama">
            ← Beranda
          </Link>
        </div>
      </div>

      {/* Form Tambah Produk */}
      <form
        action={tambahProdukAction}
        className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6"
      >
        <h2 className="text-lg font-bold">Tambah Produk / Material Baru</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nama Produk / Material *
            <input
              name="nama"
              required
              placeholder="Contoh: Botol PET Bening Terpilah 5 kg"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Kategori Material *
            <input
              name="kategori"
              list="daftar-kategori-produk"
              required
              defaultValue="Plastik"
              placeholder="Plastik, Kertas/Karton, Logam, Tekstil..."
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
            <datalist id="daftar-kategori-produk">
              {kategoriTersedia.map((kat) => (
                <option key={kat} value={kat} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Harga (Rp) *
            <input
              type="number"
              name="harga"
              min="100"
              required
              placeholder="25000"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Harga Diskon (Opsional)
            <input
              type="number"
              name="harga_diskon"
              min="100"
              placeholder="20000"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Stok Awal *
            <input
              type="number"
              name="stok"
              min="0"
              defaultValue="10"
              required
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Badge (Opsional)
            <input
              name="badge"
              placeholder="Upcycle / Terpilah"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          URL Foto Produk (Opsional)
          <input
            name="foto_url"
            placeholder="https://..."
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Deskripsi, Kondisi & Satuan
          <textarea
            name="deskripsi"
            rows={3}
            placeholder="Jelaskan kondisi material, kebersihan, ukuran/berat, atau syarat pengambilan..."
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="aktif" defaultChecked className="h-4 w-4" />
          Langsung tampilkan di katalog (Aktif)
        </label>

        <button
          type="submit"
          className="mt-1 w-fit rounded-xl bg-utama px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Simpan Produk
        </button>
      </form>

      {/* Daftar Produk */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Daftar Produk ({daftarProduk?.length ?? 0})</h2>
        {(daftarProduk ?? []).map((prod) => (
          <div
            key={prod.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-4 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-permukaan px-2.5 py-0.5 text-xs font-semibold text-utama">
                  {prod.kategori || "Umum"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    prod.aktif ? "bg-utama/15 text-utama" : "bg-permukaan text-teks-lembut"
                  }`}
                >
                  {prod.aktif ? "Aktif" : "Diarsipkan"}
                </span>
              </div>
              <p className="mt-1.5 font-extrabold">{prod.nama}</p>
              <p className="text-xs text-teks-lembut">
                Harga: <strong>Rp {Number(prod.harga).toLocaleString("id-ID")}</strong>
                {prod.harga_diskon ? ` (Diskon: Rp ${Number(prod.harga_diskon).toLocaleString("id-ID")})` : ""} • Stok saat ini: <strong>{prod.stok ?? 0}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action={updateStokAction} className="flex items-center gap-1.5">
                <input type="hidden" name="id" value={prod.id} />
                <input
                  type="number"
                  name="stok"
                  min="0"
                  defaultValue={prod.stok ?? 0}
                  aria-label="Stok produk"
                  className="w-20 rounded-xl border border-garis bg-permukaan px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold hover:border-utama"
                >
                  Update Stok
                </button>
              </form>

              <form action={toggleAktifAction}>
                <input type="hidden" name="id" value={prod.id} />
                <input type="hidden" name="aktif_baru" value={(!prod.aktif).toString()} />
                <button
                  type="submit"
                  className="rounded-xl border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold hover:border-utama"
                >
                  {prod.aktif ? "Arsipkan" : "Aktifkan"}
                </button>
              </form>

              <form action={hapusProdukAction}>
                <input type="hidden" name="id" value={prod.id} />
                <button
                  type="submit"
                  className="rounded-xl border border-bahaya/40 px-3 py-1.5 text-xs font-semibold text-bahaya"
                >
                  Hapus
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}