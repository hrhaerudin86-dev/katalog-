import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPenjual() {
  const supabase = createSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, buyer_name, subtotal, total_amount, order_status, created_at, shipments(id, courier_name, tracking_number, shipment_status)")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: ledgers } = await supabase
    .from("seller_ledgers")
    .select("*")
    .order("created_at", { ascending: false });

  async function inputResiAction(formData) {
    "use server";
    const orderId = String(formData.get("order_id") || "");
    const trackingNumber = String(formData.get("tracking_number") || "").trim();
    if (!orderId || !trackingNumber) return;

    const supabaseServer = createSupabaseServerClient();

    await supabaseServer
      .from("shipments")
      .update({
        tracking_number: trackingNumber,
        shipment_status: "in_transit",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    await supabaseServer
      .from("orders")
      .update({ order_status: "shipped" })
      .eq("id", orderId);

    revalidatePath("/penjual/dashboard");
  }

  const totalGross = (ledgers ?? []).reduce((s, l) => s + Number(l.gross_product_amount), 0);
  const totalKomisi = (ledgers ?? []).reduce((s, l) => s + Number(l.commission_amount), 0);
  const totalBersih = (ledgers ?? []).reduce((s, l) => s + Number(l.net_seller_amount), 0);

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard Penjual & Keuangan</h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Kelola pengiriman pesanan dan pantau saldo payout mingguan (komisi platform 5% dari nilai produk).
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-utama hover:underline">
          ← Beranda
        </Link>
      </div>

      {/* Ringkasan Keuangan */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Total Penjualan Produk (Selesai)</p>
          <p className="mt-1 text-xl font-extrabold">Rp {totalGross.toLocaleString("id-ID")}</p>
        </div>
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Potongan Komisi Platform (5%)</p>
          <p className="mt-1 text-xl font-extrabold text-bahaya">- Rp {totalKomisi.toLocaleString("id-ID")}</p>
        </div>
        <div className="rounded-2xl border border-utama bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Saldo Bersih Penjual (Siap Payout)</p>
          <p className="mt-1 text-xl font-extrabold text-utama">Rp {totalBersih.toLocaleString("id-ID")}</p>
        </div>
      </section>

      {/* Pesanan Masuk & Input Resi */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Pesanan Masuk & Pengiriman</h2>
        <div className="flex flex-col gap-3">
          {(orders ?? []).map((order) => {
            const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
            return (
              <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-garis bg-latar p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/pesanan/${order.id}`} className="font-extrabold hover:text-utama">
                      {order.order_number}
                    </Link>
                    <span className="ml-2 text-xs text-teks-lembut">• {order.buyer_name}</span>
                  </div>
                  <span className="rounded-full bg-permukaan px-3 py-1 text-xs font-bold text-utama">
                    {order.order_status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-teks-lembut">
                  <span>Kurir: <strong>{shipment?.courier_name}</strong> • Resi: <strong>{shipment?.tracking_number || "-"}</strong></span>
                  <span>Subtotal Produk: <strong>Rp {Number(order.subtotal).toLocaleString("id-ID")}</strong></span>
                </div>

                {order.order_status === "paid" && (
                  <form action={inputResiAction} className="mt-1 flex gap-2">
                    <input type="hidden" name="order_id" value={order.id} />
                    <input
                      name="tracking_number"
                      required
                      placeholder="Masukkan Nomor Resi Pengiriman..."
                      className="flex-1 rounded-xl border border-garis bg-permukaan px-3 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-utama px-4 py-2 text-xs font-bold text-white"
                    >
                      Kirim & Simpan Resi
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Riwayat Seller Ledger */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Buku Besar Keuangan (Seller Ledger)</h2>
        {!ledgers || ledgers.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada transaksi selesai yang masuk buku besar.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-garis bg-latar">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-garis bg-permukaan text-xs text-teks-lembut">
                <tr>
                  <th className="p-4">No. Pesanan</th>
                  <th className="p-4">Nilai Produk</th>
                  <th className="p-4">Komisi 5%</th>
                  <th className="p-4">Bersih Penjual</th>
                  <th className="p-4">Status Payout</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((row) => (
                  <tr key={row.id} className="border-b border-garis last:border-0">
                    <td className="p-4 font-bold">{row.order_number}</td>
                    <td className="p-4">Rp {Number(row.gross_product_amount).toLocaleString("id-ID")}</td>
                    <td className="p-4 text-bahaya">- Rp {Number(row.commission_amount).toLocaleString("id-ID")}</td>
                    <td className="p-4 font-bold text-utama">Rp {Number(row.net_seller_amount).toLocaleString("id-ID")}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-permukaan px-2.5 py-1 text-xs font-semibold">
                        {row.payout_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}