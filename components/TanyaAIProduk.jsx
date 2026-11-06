
"use client";

import { useState, useTransition } from "react";
import { tanyaAIProduk } from "@/app/produk/[id]/ai-actions";

export default function TanyaAIProduk({ produkId }) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [jawaban, setJawaban] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();

    const teks = pertanyaan.trim();

    if (!teks) {
      setPesanError("Silakan tulis pertanyaan terlebih dahulu.");
      return;
    }

    setJawaban("");
    setPesanError("");

    startTransition(async () => {
      try {
        const hasil = await tanyaAIProduk(produkId, teks);

        if (!hasil.sukses) {
          setPesanError(hasil.pesan);
          return;
        }

        setJawaban(hasil.jawaban);
        setPertanyaan("");
      } catch (error) {
        console.error("Gagal mengirim pertanyaan:", error);
        setPesanError("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-garis p-4">
      <div>
        <h2 className="text-xl font-bold">
          Tanya Asisten AI
        </h2>
        <p className="mt-1 text-sm text-teks-lembut">
          Punya pertanyaan tentang produk ini? Tanyakan kepada asisten AI SIRKULA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="pertanyaan-ai" className="text-sm font-semibold">
          Pertanyaan kamu
        </label>

        <textarea
          id="pertanyaan-ai"
          value={pertanyaan}
          onChange={(event) => setPertanyaan(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Contoh: Berapa harga produk ini?"
          disabled={isPending}
          className="w-full rounded-lg border border-garis bg-latar p-3 outline-none focus:border-utama disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-teks-lembut">
            {pertanyaan.length}/300 karakter
          </span>

          <button
            type="submit"
            disabled={isPending || !pertanyaan.trim()}
            className="rounded-lg bg-utama px-5 py-2.5 font-semibold text-white hover:bg-utama-gelap disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Sedang menjawab..." : "Kirim pertanyaan"}
          </button>
        </div>
      </form>

      {pesanError && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
          {pesanError}
        </div>
      )}

      {jawaban && (
        <div className="rounded-xl bg-permukaan p-4">
          <p className="mb-2 font-bold">Jawaban Asisten AI</p>
          <p className="whitespace-pre-line leading-relaxed">
            {jawaban}
          </p>
        </div>
      )}

      <p className="text-xs text-teks-lembut">
        Jawaban AI hanya berdasarkan informasi produk yang tersedia di SIRKULA.
      </p>
    </section>
  );
}
