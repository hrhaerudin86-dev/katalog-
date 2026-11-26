import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelOperasionalAdmin() {
  await requireRole(["admin"], "/admin/operasional");
  const supabase = await createSupabaseServerClient();

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

  async function updateStatusTokoAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/operasional");
    const storeId = String(formData.get("store_id") || "");
    const status = String(formData.get("status") || "");
    if (!storeId || !["verified", "rejected", "pending"].includes(status)) return;
    const db = await createSupabaseServerClient();
    await db.from("stores").update({ verification_status: status }).eq("id", storeId);
    revalidatePath("/admin/operasional");
  }

  async function updateKomplainAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/operasional");
    const complaintId = String(formData.get("complaint_id") || "");
    const status = String(formData.get("status") || "");
    if (!complaintId || !["in_review", "resolved", "rejected"].includes(status)) return;
    const db = await createSupabaseServerClient();
    await db.from("complaints").update({ status }).eq("id", complaintId);
    revalidatePath("/admin/operasional");
  }

  async function updatePayoutAction(formData) {
    "use server";
    await requireRole(["admin"], "/admin/operasional");
    const ledgerId = String(formData.get("ledger_id") || "");
    const status = String(formData.get("status") || "");
    if (!ledgerId || !["scheduled", "paid"].includes(status)) return;
    const db = await createSupabaseServerClient();
    await db.from("seller_ledgers").update({ payout_status: status }).eq("id", ledgerId);
    revalidatePath("/admin/operasional");
  }

  const totalKomisi = (ledgers ?? []).reduce((s, r) => s + Number(r.commission_amount || 0), 0);
  const totalPending = (ledgers ?? [])
    .filter((r) => r.payout_status !== "paid")
    .reduce((s, r) => s + Number(r.net_seller_amount || 0), 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Panel Operasional Admin SIRKULA</h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Verifikasi toko penjual, moderasi komplain, dan pencairan payout.
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-utama hover:underline">
          ← Beranda
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Toko Pending</p>
          <p className="mt-1 text-2xl font-extrabold">
            {(stores ?? []).filter((s) => s.verification_status === "pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Total Komisi (5%)</p>
          <p className="mt-1 text-2xl font-extrabold text-utama">
            Rp {totalKomisi.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-2xl border border-garis bg-permukaan p-5">
          <p className="text-xs text-teks-lembut">Payout Belum Cair</p>
          <p className="mt-1 text-2xl font-extrabold">
            Rp {totalPending.toLocaleString("id-ID")}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">1. Verifikasi Toko ({stores?.length ?? 0})</h2>
        {(stores ?? []).map((toko) => (
          <div
            key={toko.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-4 text-sm"
          >
            <div>
              <p className="font-bold">
                {toko.name}{" "}
                <span className="ml-2 rounded-full bg-permukaan px-2 py-0.5 text-xs">
                  {toko.verification_status}
                </span>
              </p>
              <p className="text-xs text-teks-lembut">
                {toko.location} • WA: {toko.whatsapp || "-"}
              </p>
            </div>
            <div className="flex gap-2">
              {toko.verification_status !== "verified" && (
                <form action={updateStatusTokoAction}>
                  <input type="hidden" name="store_id" value={toko.id} />
                  <input type="hidden" name="status" value="verified" />
                  <button
                    type="submit"
                    className="rounded-xl bg-utama px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Setujui
                  </button>
                </form>
              )}
              {toko.verification_status !== "rejected" && (
                <form action={updateStatusTokoAction}>
                  <input type="hidden" name="store_id" value={toko.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button
                    type="submit"
                    className="rounded-xl border border-bahaya/40 px-3 py-1.5 text-xs font-bold text-bahaya"
                  >
                    Tolak
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">2. Komplain & Retur ({complaints?.length ?? 0})</h2>
        {(complaints ?? []).length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada komplain masuk.
          </p>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-garis bg-latar p-4 text-sm"
            >
              <div>
                <p className="font-bold">
                  {c.orders?.order_number} — {c.reason} ({c.status})
                </p>
                <p className="text-xs text-teks-lembut">{c.description}</p>
              </div>
              {c.status !== "resolved" && (
                <form action={updateKomplainAction}>
                  <input type="hidden" name="complaint_id" value={c.id} />
                  <input type="hidden" name="status" value="resolved" />
                  <button
                    type="submit"
                    className="rounded-xl bg-utama px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Tandai Selesai
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">3. Pencairan Payout Penjual</h2>
        {(ledgers ?? []).length === 0 ? (
          <p className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Belum ada data payout.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-garis bg-latar">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-garis bg-permukaan text-xs text-teks-lembut">
                <tr>
                  <th className="p-3">Pesanan</th>
                  <th className="p-3">Komisi 5%</th>
                  <th className="p-3">Payout Penjual</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((row) => (
                  <tr key={row.id} className="border-b border-garis last:border-0">
                    <td className="p-3 font-bold">{row.order_number}</td>
                    <td className="p-3">Rp {Number(row.commission_amount).toLocaleString("id-ID")}</td>
                    <td className="p-3 font-bold text-utama">
                      Rp {Number(row.net_seller_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">{row.payout_status}</td>
                    <td className="p-3">
                      {row.payout_status !== "paid" ? (
                        <form action={updatePayoutAction}>
                          <input type="hidden" name="ledger_id" value={row.id} />
                          <input type="hidden" name="status" value="paid" />
                          <button
                            type="submit"
                            className="rounded-xl bg-utama px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Tandai Transfer
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs font-bold text-utama">Lunas</span>
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