import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DaftarPesanan() {
  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, buyer_name, total_amount, order_status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        <Link href="/akun/pesanan" className="text-teks-lembut hover:text-utama">
          ← Pesanan Akun Saya
        </Link>
        <Link href="/" className="text-teks-lembut hover:text-utama">
          Beranda
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold">Daftar Pesanan</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Pilih pesanan untuk melihat status pembayaran, pengiriman, komplain, dan diskusi transaksi.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="rounded-2xl border border-garis bg-permukaan p-5 text-sm text-teks-lembut">
          Belum ada pesanan tercatat.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((ord) => (
            <Link
              key={ord.id}
              href={`/pesanan/${ord.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-4 text-sm transition-colors hover:border-utama"
            >
              <div>
                <p className="font-extrabold">{ord.order_number}</p>
                <p className="text-xs text-teks-lembut">
                  {ord.buyer_name} • Rp {Number(ord.total_amount || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <span className="rounded-full bg-permukaan px-3 py-1 text-xs font-bold text-utama">
                {String(ord.order_status || "pending").toUpperCase()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}