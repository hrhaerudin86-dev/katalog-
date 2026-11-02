"use client";

export default function TombolHapus({ action }) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(event) => {
          const yakin = window.confirm(
            "Yakin ingin menghapus produk ini? Produk tidak dapat dikembalikan."
          );

          if (!yakin) event.preventDefault();
        }}
        className="inline-flex items-center justify-center rounded-lg border border-garis bg-latar px-4 py-2.5 text-sm font-semibold text-bahaya hover:border-bahaya"
      >
        Hapus
      </button>
    </form>
  );
}