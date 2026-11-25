import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RiwayatPesananPembeli() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sirkula_buyer_token")?.value;

  if (!token) {
    redirect("/akun/masuk?next=/akun/pesanan");
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    redirect("/akun/masuk?next=/akun/pesanan");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, order_status, created_at, payments(method, payment_status), shipments(courier_name, tracking_number, shipment_status)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Riwayat Pesanan Saya</h1>
          <p className="mt-1 text-sm text-teks-lembut">Akun: {user.email}</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-utama hover:underline">
          ← Belanja Lagi
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-garis bg-permukaan p-6 text-center text-sm text-teks-lembut">
          Belum ada riwayat pesanan.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
            const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;

            return (
              <Link
                key={order.id}
                href={`/pesanan/${order.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-garis bg-latar p-5 transition-colors hover:border-utama"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold">{order.order_number}</span>
                  <span className="rounded-full bg-permukaan px-3 py-1 text-xs font-bold text-utama">
                    {order.order_status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-teks-lembut">
                  <span>Pembayaran ({payment?.method}): <strong>{payment?.payment_status}</strong></span>
                  <span>Pengiriman ({shipment?.courier_name}): <strong>{shipment?.shipment_status}</strong></span>
                  {shipment?.tracking_number && (
                    <span>Resi: <strong>{shipment.tracking_number}</strong></span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-garis pt-3 text-sm">
                  <span className="text-teks-lembut">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-extrabold text-utama">
                    Rp {Number(order.total_amount).toLocaleString("id-ID")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}