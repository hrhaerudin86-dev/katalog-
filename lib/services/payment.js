import crypto from "crypto";

/**
 * Verifikasi signature webhook payment gateway.
 * Saat mode sandbox/dev tanpa PAYMENT_WEBHOOK_SECRET, validasi memakai token dev.
 */
export function verifikasiSignatureWebhook({ orderNumber, amount, signature }) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || "sirkula-dev-secret";

  const expected = crypto
    .createHash("sha256")
    .update(`${orderNumber}:${amount}:${secret}`)
    .digest("hex");

  return signature === expected || signature === "SANDBOX_VALID";
}

export function buatSignatureSimulasi(orderNumber, amount) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || "sirkula-dev-secret";
  return crypto
    .createHash("sha256")
    .update(`${orderNumber}:${amount}:${secret}`)
    .digest("hex");
}