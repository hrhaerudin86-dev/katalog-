
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const KeranjangContext = createContext(null);

const STORAGE_KEY = "sirkula-keranjang";

export function KeranjangProvider({ children }) {
  const [items, setItems] = useState([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const tersimpan = localStorage.getItem(STORAGE_KEY);

      if (tersimpan) {
        const data = JSON.parse(tersimpan);

        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (error) {
      console.error("Gagal membaca keranjang:", error);
    } finally {
      setSiap(true);
    }
  }, []);

  useEffect(() => {
    if (!siap) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Gagal menyimpan keranjang:", error);
    }
  }, [items, siap]);

  function tambahItem(produk, jumlah = 1) {
    const stok = Number(produk.stok ?? 0);
    const tambahan = Math.max(1, Math.floor(Number(jumlah) || 1));

    if (stok <= 0) return false;

    setItems((sebelumnya) => {
      const ditemukan = sebelumnya.find(
        (item) => item.id === produk.id
      );

      if (ditemukan) {
        return sebelumnya.map((item) =>
          item.id === produk.id
            ? {
                ...item,
                jumlah: Math.min(item.jumlah + tambahan, stok),
                stok,
              }
            : item
        );
      }

      return [
        ...sebelumnya,
        {
          id: produk.id,
          nama: produk.nama,
          harga: Number(produk.harga),
          harga_diskon: produk.harga_diskon ?? null,
          foto_url: produk.foto_url,
          stok,
          jumlah: Math.min(tambahan, stok),
        },
      ];
    });

    return true;
  }

  function ubahJumlah(id, jumlah) {
    const nilai = Math.floor(Number(jumlah));

    setItems((sebelumnya) =>
      sebelumnya
        .map((item) => {
          if (item.id !== id) return item;

          return {
            ...item,
            jumlah: Math.min(
              Math.max(1, nilai || 1),
              Number(item.stok)
            ),
          };
        })
        .filter((item) => item.stok > 0)
    );
  }

  function hapusItem(id) {
    setItems((sebelumnya) =>
      sebelumnya.filter((item) => item.id !== id)
    );
  }

  function kosongkanKeranjang() {
    setItems([]);
  }

  function hargaItem(item) {
    const normal = Number(item.harga);
    const diskon = Number(item.harga_diskon);

    return item.harga_diskon !== null &&
      item.harga_diskon !== undefined &&
      diskon > 0 &&
      diskon < normal
      ? diskon
      : normal;
  }

  const jumlahItem = items.reduce(
    (total, item) => total + Number(item.jumlah),
    0
  );

  const totalHarga = items.reduce(
    (total, item) => total + hargaItem(item) * Number(item.jumlah),
    0
  );

  return (
    <KeranjangContext.Provider
      value={{
        items,
        siap,
        jumlahItem,
        totalHarga,
        tambahItem,
        ubahJumlah,
        hapusItem,
        kosongkanKeranjang,
      }}
    >
      {children}
    </KeranjangContext.Provider>
  );
}

export function useKeranjang() {
  const context = useContext(KeranjangContext);

  if (!context) {
    throw new Error(
      "useKeranjang harus digunakan di dalam KeranjangProvider"
    );
  }

  return context;
}
