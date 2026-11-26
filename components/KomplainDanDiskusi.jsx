"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function KomplainDanDiskusi({
  orderId,
  orderStatus,
  buyerName,
  complaints = [],
  messages = [],
  kirimKomplainAction,
  kirimPesanDiskusiAction,
}) {
  const [fileBukti, setFileBukti] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pesanUpload, setPesanUpload] = useState("");

  async function handleUploadBukti(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      setPesanUpload("Ukuran berkas maksimal 10 MB.");
      return;
    }

    setFileBukti(file);
    setUploading(true);
    setPesanUpload("Mengunggah bukti...");

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${orderId}/${Date.now()}.${ext}`;

      const { error } = await supabaseClient.storage
        .from("complaint-evidence")
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabaseClient.storage
        .from("complaint-evidence")
        .getPublicUrl(filePath);

      setEvidenceUrl(publicUrlData?.publicUrl || "");
      setPesanUpload("Bukti berhasil diunggah.");
    } catch (err) {
      console.error(err);
      setPesanUpload("Gagal mengunggah bukti. Pastikan bucket 'complaint-evidence' sudah dibuat.");
    } finally {
      setUploading(false);
    }
  }

  const bolehAjukanKomplain = ["paid", "shipped", "delivered", "completed"].includes(
    String(orderStatus || "").toLowerCase()
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Bagian Komplain & Bukti Foto/Video (US-31, US-32, US-36) */}
      <section className="rounded-2xl border border-garis bg-latar p-5">
        <h2 className="text-lg font-bold">Komplain & Bukti Transaksi</h2>
        <p className="mt-1 text-xs text-teks-lembut">
          Ajukan komplain jika material/produk tidak sesuai atau rusak, sertakan foto/video bukti.
        </p>

        {/* Daftar Komplain yang Sudah Masuk */}
        {complaints.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-garis bg-permukaan p-3.5 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{c.reason || "Komplain Pesanan"}</span>
                  <span className="rounded-full bg-latar px-2.5 py-0.5 text-xs font-semibold text-utama">
                    {c.status || "open"}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-1 text-xs text-teks-lembut">{c.description}</p>
                )}
                {c.evidence_url && (
                  <div className="mt-2">
                    {/\.(mp4|webm|mov)$/i.test(c.evidence_url) ? (
                      <video
                        src={c.evidence_url}
                        controls
                        className="max-h-56 rounded-lg border border-garis"
                      />
                    ) : (
                      <a
                        href={c.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={c.evidence_url}
                          alt="Bukti komplain"
                          className="max-h-56 rounded-lg border border-garis object-cover"
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Ajukan Komplain Baru */}
        {bolehAjukanKomplain && (
          <form action={kirimKomplainAction} className="mt-4 flex flex-col gap-3 text-sm">
            <input type="hidden" name="order_id" value={orderId} />
            <input type="hidden" name="evidence_url" value={evidenceUrl} />

            <label className="flex flex-col gap-1 text-xs font-semibold">
              Alasan Komplain *
              <select
                name="reason"
                required
                className="rounded-xl border border-garis bg-permukaan px-3 py-2 text-sm font-normal"
              >
                <option value="Barang tidak sesuai deskripsi">Barang tidak sesuai deskripsi</option>
                <option value="Kondisi rusak / kurang layak">Kondisi rusak / kurang layak</option>
                <option value="Jumlah / berat tidak sesuai">Jumlah / berat tidak sesuai</option>
                <option value="Masalah pengiriman">Masalah pengiriman</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold">
              Uraian Masalah *
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Jelaskan kendala yang dialami pada pesanan ini..."
                className="rounded-xl border border-garis bg-permukaan px-3 py-2 text-sm font-normal"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold">
              Upload Foto / Video Bukti (Maks. 10 MB)
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleUploadBukti}
                className="rounded-xl border border-garis bg-permukaan px-3 py-2 text-xs font-normal"
              />
              {pesanUpload && (
                <span className="mt-0.5 text-xs font-medium text-utama">{pesanUpload}</span>
              )}
              {fileBukti && (
                <span className="text-[11px] text-teks-lembut">Berkas: {fileBukti.name}</span>
              )}
            </label>

            <button
              type="submit"
              disabled={uploading}
              className="w-fit rounded-xl bg-bahaya px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {uploading ? "Mengunggah Bukti..." : "Kirim Komplain"}
            </button>
          </form>
        )}
      </section>

      {/* Bagian Ruang Diskusi Transaksi (US-33 & US-54) */}
      <section className="rounded-2xl border border-garis bg-latar p-5">
        <h2 className="text-lg font-bold">Diskusi Transaksi</h2>
        <p className="mt-1 text-xs text-teks-lembut">
          Catat komunikasi terkait pesanan, pengiriman, atau penyelesaian komplain.
        </p>

        <div className="mt-4 flex max-h-72 flex-col gap-2.5 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="rounded-xl border border-garis bg-permukaan p-3 text-xs text-teks-lembut">
              Belum ada pesan diskusi pada pesanan ini.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-garis bg-permukaan p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">
                    {msg.sender_name || "Pengguna"}{" "}
                    <span className="ml-1 rounded bg-latar px-1.5 py-0.5 text-[10px] uppercase text-utama">
                      {msg.sender_role || "buyer"}
                    </span>
                  </span>
                  <span className="text-[11px] text-teks-lembut">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString("id-ID")
                      : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        <form action={kirimPesanDiskusiAction} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <input type="hidden" name="order_id" value={orderId} />
          <input
            type="hidden"
            name="sender_name"
            value={buyerName || "Pembeli"}
          />
          <input
            name="message"
            required
            placeholder="Tulis pesan diskusi transaksi..."
            className="flex-1 rounded-xl border border-garis bg-permukaan px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-utama px-4 py-2 text-xs font-bold text-white"
          >
            Kirim Pesan
          </button>
        </form>
      </section>
    </div>
  );
}