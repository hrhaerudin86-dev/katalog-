import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import FormCheckout from "@/components/FormCheckout";

export const dynamic = "force-dynamic";

function normalisasiWhatsApp(nomor) {
  const bersih = String(nomor || "").replace(/[^0-9]/g, "");
  if (bersih.startsWith("0")) return "62" + bersih.slice(1);
  if (bersih.startsWith("8")) return "62" + bersih;
  return bersih;
}

async function getAuthenticatedBuyer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sirkula_buyer_token")?.value;
  if (!token) return null;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function HalamanCheckout() {
  const user = await getAuthenticatedBuyer();
  if (!user) {
    redirect("/akun/masuk?next=/checkout");
  }

  const supabase = createSupabaseServerClient();
  const { data: profil } = await supabase
    .from("buyer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  async function buatPesananAction(formData) {
    "use server";

    const currentUser = await getAuthenticatedBuyer();
    if (!currentUser) redirect("/akun/masuk?next=/checkout");

    const supabaseServer = createSupabaseServerClient();
    const full_name = String(formData.get("full_name") || "").trim();
    const phone = normalisasiWhatsApp(formData.get("phone"));
    const city = String(formData.get("city") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const courier_name = String(formData.get("courier_name") || "Manual");
    const shipping_cost = Number(formData.get("shipping_cost") || 0);
    const payment_method = String(formData.get("payment_method") || "QRIS");
    const items = JSON.parse(String(formData.get("items_json") || "[]"));

    if (!phone || phone.length < 10) {
      throw new Error("Nomor WhatsApp tidak valid. Masukkan nomor aktif minimal 10 digit.");
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.harga_diskon || item.harga || 0) * Number(item.qty || item.jumlah || 1),
      0
    );
    const total_amount = subtotal + shipping_cost;
    const order_number = `SRK-${Date.now().toString().slice(-6)}`;

    await supabaseServer.from("buyer_profiles").upsert({
      user_id: currentUser.id,
      full_name,
      phone,
      city,
      address,
    }, { onConflict: "user_id" });

    const { data: order, error: orderErr } = await supabaseServer
      .from("orders")
      .insert({
        order_number,
        buyer_id: currentUser.id,
        buyer_name: full_name,
        buyer_phone: phone,
        shipping_address: `${address}, ${city}`,
        subtotal,
        shipping_cost,
        total_amount,
        order_status: "pending_payment",
      })
      .select()
      .single();

    if (orderErr || !order) {
      throw new Error("Gagal membuat pesanan: " + orderErr?.message);
    }

    const orderItemsData = items.map((item) => {
      const harga = Number(item.harga_diskon || item.harga || 0);
      const qty = Number(item.qty || item.jumlah || 1);
      return {
        order_id: order.id,
        product_id: Number(item.id),
        product_name: item.nama,
        price: harga,
        quantity: qty,
        subtotal: harga * qty,
      };
    });
    await supabaseServer.from("order_items").insert(orderItemsData);

    await supabaseServer.from("payments").insert({
      order_id: order.id,
      method: payment_method,
      amount: total_amount,
      payment_status: "pending",
    });

    await supabaseServer.from("shipments").insert({
      order_id: order.id,
      mode: "manual",
      courier_name,
      shipment_status: "waiting",
    });

    redirect(`/pesanan/${order.id}`);
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-3xl font-extrabold">Checkout Pesanan</h1>
      <FormCheckout profilAwal={profil} buatPesananAction={buatPesananAction} />
    </div>
  );
}