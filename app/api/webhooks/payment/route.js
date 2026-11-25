import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifikasiSignatureWebhook } from "@/lib/services/payment";

export async function POST(request) {
  try {
    const body = await request.json();
    const { order_number, provider_ref, amount, status, signature } = body;

    if (!order_number || !status) {
      return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
    }

    // 1. Verifikasi signature resmi gateway
    const isValid = verifikasiSignatureWebhook({
      orderNumber: order_number,
      amount: Number(amount || 0),
      signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Signature tidak valid" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // 2. Cari order & payment terkait
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_status, total_amount")
      .eq("order_number", order_number)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("order_id", order.id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 });
    }

    // 3. Idempotency check: kalau sudah paid, jangan diproses ulang
    if (payment.payment_status === "paid") {
      return NextResponse.json({ ok: true, message: "Sudah tervalidasi sebelumnya" });
    }

    // 4. Update status terpisah (payments & orders)
    if (status === "paid") {
      await supabase
        .from("payments")
        .update({
          payment_status: "paid",
          provider_ref: provider_ref || `PG-${Date.now()}`,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      await supabase
        .from("orders")
        .update({ order_status: "paid" })
        .eq("id", order.id);
    } else if (status === "failed" || status === "expired") {
      await supabase
        .from("payments")
        .update({ payment_status: status })
        .eq("id", payment.id);

      await supabase
        .from("orders")
        .update({ order_status: "cancelled" })
        .eq("id", order.id);
    }

    return NextResponse.json({ ok: true, order_number, status });
  } catch (err) {
    console.error("Webhook payment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}