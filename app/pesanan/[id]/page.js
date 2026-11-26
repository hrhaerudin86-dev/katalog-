import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buatSignatureSimulasi } from "@/lib/services/payment";
import UploadBuktiKomplain from "@/components/UploadBuktiKomplain";

export const dynamic = "force-dynamic";

export default async function DetailPesanan({ params }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", id).single();
  const { data: shipment } = await supabase.from("shipments").select("*").eq("order_id", id).single();
  const { data: complaint } = await supabase.from("complaints").select("*").eq("order_id", id).single();
  const { data: review } = await supabase.from("reviews").select("*").eq("order_id", id).single();
  const { data: messages } = await supabase
    .from("complaint_messages")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  async function simulasiBayarAction() {
    "use server";
    const supabaseServer = createSupabaseServerClient();
    const sig = buatSignatureSimulasi(order.order_number, order.total_amount);

    if (sig) {
      await supabaseServer
        .from("payments")
        .update({
          payment_status: "paid",
          provider_ref: `SANDBOX-${Date.now()}`,
          paid_at: new Date().toISOString(),
        })
        .eq("order_id", order.id);

      await supabaseServer
        .from("orders")
        .update({ order_status: "paid" })
        .eq("id", order.id);
    }

    revalidatePath(`/pesanan/${order.id}`);
    redirect(`/pesanan/${order.id}`);
  }

  async function konfirmasiSelesaiAction() {
    "use server";
    const supabaseServer = createSupabaseServerClient();

    await supabaseServer
      .from("orders")
      .update({ order_status: "completed" })
      .eq("id", order.id);

    await supabaseServer
      .from("shipments")
      .update({ shipment_status: "delivered", updated_at: new Date().toISOString() })
      .eq("order_id", order.id);

    const grossProduct = Number(order.subtotal || 0);
    const commissionRate = 0.05;
    const commissionAmount = Math.round(grossProduct * commissionRate);
    const netSellerAmount = grossProduct - commissionAmount;

    await supabaseServer.from("seller_ledgers").upsert(
      {
        order_id: order.id,
        order_number: order.order_number,
        gross_product_amount: grossProduct,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_seller_amount: netSellerAmount,
        payout_status: "pending",
      },
      { onConflict: "order_id" }
    );

    revalidatePath(`/pesanan/${order.id}`);
    redirect(`/pesanan/${order.id}`);
  }

  async function ajukanKomplainAction(formData) {
    "use server";
    const reason = String(formData.get("reason") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const evidenceUrl = String(formData.get("evidence_url") || "").trim() || null;
    if (!reason || !description) return;

    const supabaseServer = createSupabaseServerClient();

    await supabaseServer.from("complaints").insert({
      order_id: order.id,
      buyer_id: order.buyer_id,
      reason,
      description,
      evidence_url: evidenceUrl,
      status: "open",
    });

    await supabaseServer
      .from("orders")
      .update({ order_status: "complained" })
      .eq("id", order.id);

    revalidatePath(`/pesanan/${order.id}`);
    redirect(`/pesanan/${order.id}`);
  }

  async function kirimPesanDiskusiAction(formData) {
    "use server";
    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    const supabaseServer = createSupabaseServerClient();
    await supabaseServer.from("complaint_messages").insert({
      order_id: order.id,
      sender_role: "buyer",
      sender_name: order.buyer_name || "Pembeli",
      message,
    });

    revalidatePath(`/pesanan/${order.id}`);
    redirect(`/pesanan/${order.id}`);
  }

  async function kirimUlasanAction(formData) {
    "use server";
    const rating = Number(formData.get("rating") || 5);
    const comment = String(formData.get("comment") || "").trim();

    const supabaseServer = createSupabaseServerClient();

    await supabaseServer.from("reviews").upsert(
      {
        order_id: order.id,
        buyer_id: order.buyer_id,
        rating,
        comment,
      },
      { onConflict: "order_id,buyer_id" }
    );

    revalidatePath(`/pesanan/${order.id}`);
    redirect(`/pesanan/${order.id}`);
  }

  const bisaKonfirmasi = ["paid", "processing", "shipped", "delivered"].includes(order.order_status);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between text-sm">
        <Link href="/akun/pesanan" className="text-teks-lembut hover:text-utama">
          ← Semua Pesanan Saya
        </Link>
        <Link href="/" className="text-teks-lembut hover:text-utama">
          Beranda
        </Link>
      </div>

      {/* Status Header */}
      <div className="rounded-2xl border border-utama bg-permukaan p-6">
        <span className="rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
          {order.order_status.toUpperCase()}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold">Nomor Pesanan: {order.order_number}</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Pembayaran: <strong>{payment?.payment_status}</strong> • Pengiriman: <strong>{shipment?.shipment_status}</strong>
        </p>
      </div>

      {/* Instruksi Pembayaran jika masih pending */}
      {payment?.payment_status === "pending" && (
        <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
          <h2 className="text-base font-bold">Instruksi Pembayaran ({payment.method})</h2>
          {payment.method === "COD" ? (
            <p className="mt-2 text-teks-lembut">
              Pesanan COD akan ditagihkan oleh kurir saat paket tiba.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-teks-lembut">
                Selesaikan pembayaran sebesar <strong>Rp {Number(order.total_amount).toLocaleString("id-ID")}</strong> melalui {payment.method}.
              </p>
              <form action={simulasiBayarAction}>
                <button
                  type="submit"
                  className="rounded-xl bg-utama px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  Simulasi Konfirmasi Bayar Lunas (Mode Sandbox)
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Aksi Purna Jual: Konfirmasi Selesai / Komplain */}
      {bisaKonfirmasi && (
        <section className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-6 text-sm">
          <h2 className="text-base font-bold">Konfirmasi Penerimaan Barang</h2>
          <p className="text-teks-lembut">
            Jika paket sudah diterima dengan baik, klik tombol di bawah agar dana diteruskan ke penjual.
          </p>
          <form action={konfirmasiSelesaiAction}>
            <button
              type="submit"
              className="w-full rounded-xl bg-utama px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Pesanan Diterima & Selesai
            </button>
          </form>

          <details open className="mt-2 rounded-xl border border-garis bg-permukaan p-4">
            <summary className="cursor-pointer font-semibold text-bahaya">
              Barang bermasalah? Ajukan Komplain / Retur
            </summary>
            <form action={ajukanKomplainAction} className="mt-4 flex flex-col gap-3">
              <select
                name="reason"
                required
                className="rounded-xl border border-garis bg-latar px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Alasan Komplain --</option>
                <option value="Barang rusak / cacat">Barang rusak / cacat</option>
                <option value="Tidak sesuai deskripsi">Tidak sesuai deskripsi</option>
                <option value="Jumlah kurang">Jumlah kurang</option>
              </select>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Jelaskan kendala barang yang diterima..."
                className="rounded-xl border border-garis bg-latar px-3 py-2 text-sm"
              />
              <UploadBuktiKomplain orderId={order.id} />
              <button
                type="submit"
                className="rounded-xl bg-bahaya px-4 py-2.5 text-xs font-bold text-white"
              >
                Kirim Pengajuan Komplain
              </button>
            </form>
          </details>
        </section>
      )}

      {/* Info Komplain jika sudah diajukan */}
      {complaint && (
        <section className="rounded-2xl border border-bahaya/40 bg-bahaya/5 p-6 text-sm">
          <h2 className="text-base font-bold text-bahaya">Komplain Sedang Diproses ({complaint.status})</h2>
          <p className="mt-1"><strong>Alasan:</strong> {complaint.reason}</p>
          <p className="mt-1 text-teks-lembut">{complaint.description}</p>
          {complaint.evidence_url && (
            <a
              href={complaint.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-utama underline"
            >
              Lihat Bukti Terlampir →
            </a>
          )}
        </section>
      )}

      {/* Diskusi Transaksi */}
      <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
        <h2 className="text-base font-bold">Diskusi Transaksi</h2>
        <div className="mt-3 flex flex-col gap-2">
          {(messages ?? []).length === 0 ? (
            <p className="rounded-xl bg-permukaan p-3 text-xs text-teks-lembut">
              Belum ada pesan diskusi.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-garis bg-permukaan p-3 text-xs">
                <p className="font-bold">
                  {m.sender_name} <span className="text-utama">({m.sender_role})</span>
                </p>
                <p className="mt-1 text-sm">{m.message}</p>
              </div>
            ))
          )}
        </div>
        <form action={kirimPesanDiskusiAction} className="mt-4 flex gap-2">
          <input
            name="message"
            required
            placeholder="Tulis pesan diskusi pesanan..."
            className="flex-1 rounded-xl border border-garis bg-permukaan px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-utama px-4 py-2 text-xs font-bold text-white"
          >
            Kirim
          </button>
        </form>
      </section>

      {/* Form Ulasan jika pesanan sudah selesai */}
      {order.order_status === "completed" && (
        <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
          <h2 className="text-base font-bold">Ulasan Pembeli</h2>
          {review ? (
            <div className="mt-2 rounded-xl bg-permukaan p-4">
              <p className="font-bold">Rating: {"★".repeat(review.rating)} ({review.rating}/5)</p>
              <p className="mt-1 text-teks-lembut">{review.comment || "Tanpa komentar."}</p>
            </div>
          ) : (
            <form action={kirimUlasanAction} className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 font-semibold">
                Rating (1–5)
                <select
                  name="rating"
                  defaultValue="5"
                  className="rounded-xl border border-garis bg-permukaan px-3 py-2 text-sm font-normal"
                >
                  <option value="5">★★★★★ (5 - Sangat Puas)</option>
                  <option value="4">★★★★ (4 - Puas)</option>
                  <option value="3">★★★ (3 - Cukup)</option>
                  <option value="2">★★ (2 - Kurang)</option>
                  <option value="1">★ (1 - Buruk)</option>
                </select>
              </label>
              <textarea
                name="comment"
                rows={3}
                placeholder="Tulis pengalaman Anda tentang kualitas material/produk ini..."
                className="rounded-xl border border-garis bg-permukaan px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-xl bg-utama px-4 py-2.5 text-sm font-bold text-white"
              >
                Kirim Ulasan
              </button>
            </form>
          )}
        </section>
      )}

      {/* Pelacakan Pengiriman */}
      <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
        <h2 className="mb-3 text-base font-bold">Data Penerima & Pelacakan Pengiriman</h2>
        <div className="flex flex-col gap-1.5">
          <p><span className="text-teks-lembut">Nama:</span> <strong>{order.buyer_name}</strong></p>
          <p><span className="text-teks-lembut">No. WhatsApp:</span> <strong>+{order.buyer_phone}</strong></p>
          <p><span className="text-teks-lembut">Alamat:</span> {order.shipping_address}</p>
          <p className="mt-2 border-t border-garis pt-2">
            <span className="text-teks-lembut">Kurir:</span> <strong>{shipment?.courier_name}</strong> ({shipment?.mode})
          </p>
          <p>
            <span className="text-teks-lembut">Nomor Resi:</span>{" "}
            <strong>{shipment?.tracking_number || "Menunggu penjual memproses pengiriman"}</strong>
          </p>
        </div>
      </section>

      {/* Rincian Transaksi */}
      <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
        <h2 className="mb-3 text-base font-bold">Rincian Transaksi</h2>
        <div className="flex flex-col gap-2 border-b border-garis pb-3">
          {(items ?? []).map((it) => (
            <div key={it.id} className="flex justify-between">
              <span>{it.product_name} × {it.quantity}</span>
              <span className="font-semibold">Rp {Number(it.subtotal).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-teks-lembut">Ongkos Kirim</span>
            <span>Rp {Number(order.shipping_cost).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-teks-lembut">Metode Pembayaran</span>
            <span>{payment?.method}</span>
          </div>
          {payment?.provider_ref && (
            <div className="flex justify-between">
              <span className="text-teks-lembut">Referensi Pembayaran</span>
              <span className="font-mono text-xs">{payment.provider_ref}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-garis pt-2 text-base font-extrabold">
            <span>Total</span>
            <span className="text-utama">Rp {Number(order.total_amount).toLocaleString("id-ID")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}