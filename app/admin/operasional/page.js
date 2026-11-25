import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PanelOperasionalAdmin() {
  const supabase = createSupabaseServerClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: complaints } = await supabase
    .from("complaints")
    .select("*, orders(order_number, buyer_name, buyer_phone)")
    .order("created_at", { ascending: false });

  const { data: ledgers } = await supabase
    .from("seller_ledgers")
    .select("*")
    .order("created_at", { ascending: false });

  // 1. Aksi Verifikasi Toko
  async function updateStatusTokoAction(formData) {
    "use server";
    const storeId = String(formData.get("store_id") || "");
    const status = String(formData.get("status") || "");
    if (!storeId || !["verified", "rejected", "pending"].includes(status)) return;

    const supabaseServer = createSupabaseServerClient();
    await supabaseServer
      .from("stores")
      .update({ verification_status: status })
      .eq("id", storeId);

    revalidatePath("/admin/operasional");
  }

  // 2. Aksi Update Status Komplain
  async function updateKomplainAction(formData) {
    "use server";
    const complaintId = String(formData.get("complaint_id") || "");
    const status = String(formData.get("status") || "");
    if (!complaintId || !["in_review", "resolved", "rejected"].includes(status)) return;

    const supabaseServer = createSupabaseServerClient();
    await supabaseServer
      .from("complaints")
      .update({ status })
      .eq("id", complaintId);

    revalidatePath("/admin/operasional");
  }

  // 3. Aksi Konfirmasi Payout Penjual
  async function updatePayoutAction(formData) {
    "use server";
    const ledgerId = String(formData.get("ledger_id") || "");
    const status = String(formData.get("status") || "");
    if (!ledgerId || !["scheduled", "paid"].includes(status)) return;

    const supabaseServer = createSupabaseServerClient();
    await supabaseServer
      .from("seller_ledgers")
      .update({ payout_status: status })
      .eq("id", ledgerId);

    revalidatePath("/admin/operasional");
  }

  const totalKomisiPlatform = (ledgers ?? []).reduce(
    (sum, row) => sum + Number(row.commission_amount || 0),
    0
  );
  const totalPayoutPending = (ledgers ?? [])
    .filter((r) => r.payout_status !== "paid")
    .reduce((sum, row) => sum + Number(row.net_seller_amount || 0), 0);

  return (
    <div className="flex flex-col gap-10 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Panel Operasional Admin SIRKULA</h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Verifikasi toko penjual, moderasi komplain, dan pencairan payout mingguan.
          </p>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href="/penjual/dashboard" className="text-utama hover:underline">
            Dashboard Penjual
          </Link>
          <Link href="/" className="text-teks-lembut hover:text-utama">
            ← Beranda
          </Link>
        </div>
      </div>

      {/* Ringkasan KPI Platform */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Toko Menunggu Verifikasi</p>
          <p className="mt-1 text-2xl font-extrabold">
            {(stores ?? []).filter((s) => s.verification_status === "pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Total Pendapatan Komisi (5%)</p>
          <p className="mt-1 text-2xl font-extrabold text-utama">
            Rp {totalKomisiPlatform.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Payout Penjual Belum Cair</p>
          <p className="mt-1 text-2xl font-extrabold">
            Rp {totalPayoutPending.toLocaleString("id-ID")}
          </p>
        </div>
      </section>

      {/* 1. Verifikasi Toko */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">1. Verifikasi Toko Penjual ({stores?.length ?? 0})</h2>
        <div className="flex flex-col gap-3">
          {(stores ?? []).map((toko) => (
            <div
              key={toko.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-5 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/toko/${toko.slug}`} className="font-extrabold hover:text-utama">
                    {toko.name}
                  </Link>
                  <span className="rounded-full bg-permukaan px-2.5 py-0.5 text-xs font-bold">
                    {toko.verification_status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-teks-lembut">
                  {toko.location} • WA: {toko.whatsapp || "-"} • Email: {toko.owner_email || "-"}
                </p>
              </div>

              <div className="flex gap-2">
                {toko.verification_status !== "verified" && (
                  <form action={updateStatusTokoAction}>
                    <input type="hidden" name="store_id" value={toko.id} />
                    <input type="hidden" name="status" value="verified" />
                    <button
                      type="submit"
                      className="rounded-xl bg-utama px-3.5 py-2 text-xs font-bold text-white"
                    >
                      Setujui (Verified)
                    </button>
                  </form>
                )}
                {toko.verification_status !== "rejected" && (
                  <form action={updateStatusTokoAction}>
                    <input type="hidden" name="store_id" value={toko.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="rounded-xl border border-bahaya/40 px-3.5 py-2 text-xs font-bold text-bahaya"
                    >
                      Tolak
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Moderasi Komplain */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">2. Daftar Komplain & Retur ({complaints?.length ?? 0})</h2>
        {!complaints || complaints.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Tidak ada komplain masuk.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-5 text-sm"
              >
                <div>
                  <p className="font-bold">
                    {c.orders?.order_number} — {c.reason}{" "}
                    <span className="ml-1 rounded-full bg-permukaan px-2 py-0.5 text-xs">
                      {c.status}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-teks-lembut">{c.description}</p>
                  <p className="mt-1 text-xs text-teks-lembut">
                    Pembeli: {c.orders?.buyer_name} (+{c.orders?.buyer_phone})
                  </p>
                </div>

                {c.status !== "resolved" && (
                  <div className="flex gap-2">
                    <form action={updateKomplainAction}>
                      <input type="hidden" name="complaint_id" value={c.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button
                        type="submit"
                        className="rounded-xl bg-utama px-3.5 py-2 text-xs font-bold text-white"
                      >
                        Tandai Selesai
                      </button>
                    </form>
                    <form action={updateKomplainAction}>
                      <input type="hidden" name="complaint_id" value={c.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="rounded-xl border border-bahaya/40 px-3.5 py-2 text-xs font-bold text-bahaya"
                      >
                        Tolak
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Pencairan Payout Mingguan */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">3. Pencairan Payout Penjual</h2>
        {!ledgers || ledgers.length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada data payout.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-garis bg-latar">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-garis bg-permukaan text-xs text-teks-lembut">
                <tr>
                  <th className="p-4">No. Pesanan</th>
                  <th className="p-4">Komisi (5%)</th>
                  <th className="p-4">Payout Penjual</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((row) => (
                  <tr key={row.id} className="border-b border-garis last:border-0">
                    <td className="p-4 font-bold">{row.order_number}</td>
                    <td className="p-4 text-teks-lembut">
                      Rp {Number(row.commission_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 font-bold text-utama">
                      Rp {Number(row.net_seller_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-permukaan px-2.5 py-1 text-xs font-semibold">
                        {row.payout_status}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.payout_status !== "paid" ? (
                        <form action={updatePayoutAction}>
                          <input type="hidden" name="ledger_id" value={row.id} />
                          <input type="hidden" name="status" value="paid" />
                          <button
                            type="submit"
                            className="rounded-xl bg-utama px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Tandai Sudah Transfer
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs font-semibold text-utama">Lunas</span>
                      )}
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