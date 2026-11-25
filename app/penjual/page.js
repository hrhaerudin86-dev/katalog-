import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buatSlug(teks) {
  return (teks || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function HalamanDaftarPenjual({ searchParams }) {
  const params = await searchParams;
  const sukses = params?.sukses === "1";
  const pesanError = params?.error || "";

  async function daftarTokoAction(formData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const owner_email = String(formData.get("owner_email") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!name || !owner_email || !location || !whatsapp) {
      redirect("/penjual?error=Semua+kolom+wajib+harus+diisi");
    }

    const slug = `${buatSlug(name)}-${Date.now().toString().slice(-4)}`;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("stores").insert({
      name,
      slug,
      owner_email,
      location,
      whatsapp,
      description,
      verification_status: "pending",
    });

    if (error) {
      console.error("Gagal daftar toko:", error);
      redirect("/penjual?error=Gagal+mengirim+pendaftaran.+Coba+lagi");
    }

    redirect("/penjual?sukses=1");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-8">
      <Link href="/" className="text-sm text-teks-lembut hover:text-utama">
        ← Kembali ke Beranda
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold">Buka Toko di SIRKULA</h1>
        <p className="mt-2 text-sm text-teks-lembut">
          Daftarkan usaha, bank sampah, atau pemasok material Anda. Admin akan memverifikasi toko sebelum listing dipublikasikan.
        </p>
      </div>

      {sukses && (
        <div className="rounded-xl border border-utama bg-permukaan p-4 text-sm">
          <p className="font-bold text-utama">Pengajuan toko berhasil dikirim!</p>
          <p className="mt-1 text-teks-lembut">
            Tim admin SIRKULA akan meninjau dan memverifikasi data toko Anda.
          </p>
        </div>
      )}

      {pesanError && (
        <div className="rounded-xl border border-bahaya/30 bg-bahaya/5 p-4 text-sm text-bahaya">
          {pesanError}
        </div>
      )}

      <form action={daftarTokoAction} className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Nama Toko / Usaha *
          <input
            name="name"
            required
            placeholder="Contoh: Bank Sampah Mekar Jaya"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email Pemilik *
          <input
            name="owner_email"
            type="email"
            required
            placeholder="nama@email.com"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Nomor WhatsApp (awalan 62) *
          <input
            name="whatsapp"
            required
            placeholder="6281234567890"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Lokasi / Kota Asal *
          <input
            name="location"
            required
            placeholder="Contoh: Pagaden, Kab. Subang"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Deskripsi Usaha & Jenis Material
          <textarea
            name="description"
            rows={3}
            placeholder="Jelaskan material sisa atau produk daur ulang yang Anda tawarkan..."
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Ajukan Pembukaan Toko
        </button>
      </form>
    </div>
  );
}