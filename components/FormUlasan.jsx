
"use client";

import { kirimUlasan } from "@/app/produk/[id]/actions";

export default function FormUlasan({ produkId }) {
  return (
    <form
      action={kirimUlasan.bind(null, produkId)}
      className="flex flex-col gap-4 rounded-2xl border border-garis bg-latar p-5"
    >
      <h3 className="text-lg font-bold">Tulis Ulasan Produk</h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="nama" className="text-sm font-semibold">
          Nama kamu
        </label>
        <input
          id="nama"
          name="nama"
          maxLength={80}
          required
          placeholder="Masukkan nama"
          className="rounded-xl border border-garis bg-permukaan p-3"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="rating" className="text-sm font-semibold">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          required
          defaultValue="5"
          className="rounded-xl border border-garis bg-permukaan p-3"
        >
          <option value="5">★★★★★ - Sangat bagus</option>
          <option value="4">★★★★ - Bagus</option>
          <option value="3">★★★ - Cukup</option>
          <option value="2">★★ - Kurang</option>
          <option value="1">★ - Buruk</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="komentar" className="text-sm font-semibold">
          Komentar
        </label>
        <textarea
          id="komentar"
          name="komentar"
          required
          maxLength={1000}
          rows={4}
          placeholder="Bagaimana pendapatmu tentang produk ini?"
          className="rounded-xl border border-garis bg-permukaan p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-utama px-5 py-3 font-bold text-white hover:opacity-90"
      >
        Kirim Ulasan
      </button>
    </form>
  );
}
