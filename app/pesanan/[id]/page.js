import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buatSignatureSimulasi } from "@/lib/services/payment";

export const dynamic = "force-dynamic";

export default async function DetailPesanan({ params }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", id).single();
  const { data: shipment } = await supabase.from("shipments").select("*").eq("order_id", id).single();

  // Server Action simulasi webhook pembayaran (khusus testing sandbox)
  async function simulasiBayarAction() {
    "use server";

    const supabaseServer = createSupabaseServerClient();
    const sig = buatSignatureSimulasi(order.order_number, order.total_amount);

    // Panggil logika update terverifikasi
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
              Pesanan COD akan ditagihkan oleh kurir saat paket tiba. Status lunas diperbarui setelah konfirmasi penagihan kurir.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-teks-lembut">
                Silakan selesaikan pembayaran sebesar <strong>Rp {Number(order.total_amount).toLocaleString("id-ID")}</strong> melalui {payment.method}. Status akan otomatis berubah setelah konfirmasi resmi payment gateway.
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