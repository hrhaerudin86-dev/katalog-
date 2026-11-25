import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DetailPesanan({ params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", id).single();
  const { data: shipment } = await supabase.from("shipments").select("*").eq("order_id", id).single();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div className="rounded-2xl border border-utama bg-permukaan p-6">
        <span className="rounded-full bg-utama px-3 py-1 text-xs font-bold text-white">
          Pesanan Dibuat
        </span>
        <h1 className="mt-3 text-2xl font-extrabold">Nomor Pesanan: {order.order_number}</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Status Pesanan: <strong>{order.order_status}</strong> • Pembayaran: <strong>{payment?.payment_status}</strong> • Pengiriman: <strong>{shipment?.shipment_status}</strong>
        </p>
      </div>

      <section className="rounded-2xl border border-garis bg-latar p-6 text-sm">
        <h2 className="mb-3 text-base font-bold">Data Penerima & Pengiriman</h2>
        <div className="flex flex-col gap-1.5">
          <p><span className="text-teks-lembut">Nama:</span> <strong>{order.buyer_name}</strong></p>
          <p><span className="text-teks-lembut">No. WhatsApp:</span> <strong>+{order.buyer_phone}</strong></p>
          <p><span className="text-teks-lembut">Alamat:</span> {order.shipping_address}</p>
        </div>
      </section>

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
            <span className="text-teks-lembut">Kurir ({shipment?.courier_name})</span>
            <span>Rp {Number(order.shipping_cost).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-teks-lembut">Metode Pembayaran</span>
            <span>{payment?.method}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-garis pt-2 text-base font-extrabold">
            <span>Total</span>
            <span className="text-utama">Rp {Number(order.total_amount).toLocaleString("id-ID")}</span>
          </div>
        </div>
      </section>

      <Link href="/" className="text-center text-sm font-semibold text-utama hover:underline">
        ← Kembali Belanja di SIRKULA
      </Link>
    </div>
  );
}