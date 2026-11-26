import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import UploadCoverArtikel from "@/components/UploadCoverArtikel";

export const dynamic = "force-dynamic";

function buatSlug(teks) {
  return String(teks || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default async function KelolaArtikelAdmin() {
  await requireRole(["admin"], "/admin/artikel");

  const supabase = await createSupabaseServerClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  async function tambahArtikelAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/artikel");

    const title = String(formData.get("title") || "").trim();
    const topic = String(formData.get("topic") || "Edukasi Material").trim();
    const excerpt = String(formData.get("excerpt") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const coverUrl = String(formData.get("cover_url") || "").trim() || null;
    const status = String(formData.get("status") || "published");

    if (!title || !content) return;

    const slug = `${buatSlug(title)}-${Date.now().toString().slice(-4)}`;
    const supabaseServer = await createSupabaseServerClient();

    await supabaseServer.from("articles").insert({
      title,
      slug,
      topic,
      excerpt,
      content,
      cover_url: coverUrl,
      status: ["published", "draft"].includes(status) ? status : "published",
      published_at: status === "published" ? new Date().toISOString() : null,
    });

    revalidatePath("/admin/artikel");
    revalidatePath("/artikel");
    revalidatePath("/");
  }

  async function ubahStatusArtikelAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/artikel");

    const id = String(formData.get("id") || "");
    const statusBaru = String(formData.get("status") || "published");
    if (!id) return;

    const supabaseServer = await createSupabaseServerClient();
    await supabaseServer
      .from("articles")
      .update({
        status: statusBaru,
        published_at: statusBaru === "published" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    revalidatePath("/admin/artikel");
    revalidatePath("/artikel");
    revalidatePath("/");
  }

  async function hapusArtikelAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/artikel");

    const id = String(formData.get("id") || "");
    if (!id) return;

    const supabaseServer = await createSupabaseServerClient();
    await supabaseServer.from("articles").delete().eq("id", id);

    revalidatePath("/admin/artikel");
    revalidatePath("/artikel");
    revalidatePath("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold">Kelola Artikel & Insight (CMS)</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Buat, terbitkan, atau arsipkan artikel edukasi ekonomi sirkular SIRKULA DAURLINK.
        </p>
      </div>

      <form
        action={tambahArtikelAction}
        className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6"
      >
        <h2 className="text-lg font-bold">Tulis Artikel Baru</h2>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Judul Artikel *
          <input
            name="title"
            required
            placeholder="Contoh: Cara Memilah Limbah Plastik Rumah Tangga Bernilai Jual"
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Topik / Kategori *
            <input
              name="topic"
              required
              defaultValue="Pemilahan Material"
              placeholder="Contoh: Pemilahan Material, Upcycle, Kisah UMKM"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Status Publikasi
            <select
              name="status"
              defaultValue="published"
              className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
            >
              <option value="published">Langsung Terbitkan (Published)</option>
              <option value="draft">Simpan sebagai Draft</option>
            </select>
          </label>
        </div>

        <UploadCoverArtikel />

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Ringkasan Singkat (Excerpt)
          <input
            name="excerpt"
            placeholder="1–2 kalimat ringkasan yang muncul di kartu daftar artikel..."
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Isi Artikel Lengkap *
          <textarea
            name="content"
            required
            rows={8}
            placeholder="Tulis isi artikel edukasi di sini. Pisahkan antar paragraf dengan tombol Enter..."
            className="rounded-xl border border-garis bg-permukaan px-4 py-2.5 text-sm font-normal"
          />
        </label>

        <button
          type="submit"
          className="mt-1 w-fit rounded-xl bg-utama px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Simpan & Terbitkan Artikel
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Daftar Artikel ({articles?.length ?? 0})</h2>
        {(articles ?? []).map((art) => (
          <div
            key={art.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-5 text-sm"
          >
            <div className="flex min-w-0 flex-1 items-start gap-4">
              {art.cover_url && (
                <img
                  src={art.cover_url}
                  alt={art.title}
                  className="h-16 w-24 shrink-0 rounded-xl border border-garis object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-permukaan px-2.5 py-0.5 text-xs font-semibold text-utama">
                    {art.topic}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      art.status === "published"
                        ? "bg-utama/15 text-utama"
                        : "bg-permukaan text-teks-lembut"
                    }`}
                  >
                    {art.status}
                  </span>
                </div>
                <Link
                  href={`/artikel/${art.slug}`}
                  className="mt-2 block font-extrabold hover:text-utama"
                >
                  {art.title}
                </Link>
                {art.excerpt && (
                  <p className="mt-1 line-clamp-1 text-xs text-teks-lembut">{art.excerpt}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form action={ubahStatusArtikelAction}>
                <input type="hidden" name="id" value={art.id} />
                <input
                  type="hidden"
                  name="status"
                  value={art.status === "published" ? "draft" : "published"}
                />
                <button
                  type="submit"
                  className="rounded-xl border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold hover:border-utama"
                >
                  {art.status === "published" ? "Jadikan Draft" : "Terbitkan"}
                </button>
              </form>

              <form action={hapusArtikelAction}>
                <input type="hidden" name="id" value={art.id} />
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