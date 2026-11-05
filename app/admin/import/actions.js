
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseCSV(teks) {
  const baris = [];
  let kolom = "";
  let dataBaris = [];
  let dalamKutip = false;

  for (let i = 0; i < teks.length; i++) {
    const karakter = teks[i];
    const berikutnya = teks[i + 1];

    if (karakter === '"' && dalamKutip && berikutnya === '"') {
      kolom += '"';
      i++;
    } else if (karakter === '"') {
      dalamKutip = !dalamKutip;
    } else if (karakter === "," && !dalamKutip) {
      dataBaris.push(kolom.trim());
      kolom = "";
    } else if (
      (karakter === "\n" || karakter === "\r") &&
      !dalamKutip
    ) {
      if (karakter === "\r" && berikutnya === "\n") i++;

      dataBaris.push(kolom.trim());

      if (dataBaris.some((nilai) => nilai !== "")) {
        baris.push(dataBaris);
      }

      dataBaris = [];
      kolom = "";
    } else {
      kolom += karakter;
    }
  }

  if (dalamKutip) {
    throw new Error("Format CSV tidak valid: tanda kutip tidak berpasangan.");
  }

  dataBaris.push(kolom.trim());

  if (dataBaris.some((nilai) => nilai !== "")) {
    baris.push(dataBaris);
  }

  return baris;
}

function validasiBaris(data, nomorBaris) {
  const gagal = [];

  const nama = String(data.nama || "").trim();
  const nilaiHarga = String(data.harga || "").trim();
  const harga = Number(nilaiHarga);
  const nilaiStok = String(data.stok ?? "1").trim();
  const stok = Number(nilaiStok);
  const kategori = String(data.kategori || "").trim();
  const deskripsi = String(data.deskripsi || "").trim();
  const foto_url = String(data.foto_url || "").trim();

  const nilaiDiskon = String(data.harga_diskon || "").trim();
  const harga_diskon =
    nilaiDiskon === "" ? null : Number(nilaiDiskon);

  const badge = String(data.badge || "").trim() || null;

  const foto_galeri = String(data.foto_galeri || "")
    .split("|")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!nama) gagal.push("Nama produk wajib diisi.");

  if (
    nilaiHarga === "" ||
    !Number.isSafeInteger(harga) ||
    harga <= 0
  ) {
    gagal.push("Harga harus berupa angka bulat positif.");
  }

  if (
    nilaiStok === "" ||
    !Number.isInteger(stok) ||
    stok < 0
  ) {
    gagal.push("Stok harus berupa bilangan bulat minimal 0.");
  }

  if (!kategori) gagal.push("Kategori wajib diisi.");

  if (
    harga_diskon !== null &&
    (
      !Number.isSafeInteger(harga_diskon) ||
      harga_diskon <= 0 ||
      harga_diskon >= harga
    )
  ) {
    gagal.push("Harga diskon harus lebih kecil dari harga normal.");
  }

  if (badge !== null && !["Baru", "Terlaris"].includes(badge)) {
    gagal.push("Badge hanya boleh Baru atau Terlaris.");
  }

  if (foto_galeri.length > 10) {
    gagal.push("Foto galeri maksimal 10 URL.");
  }

  if (foto_url && !/^https?:\/\/.+/i.test(foto_url)) {
    gagal.push("URL foto utama tidak valid.");
  }

  if (
    foto_galeri.some((url) => !/^https?:\/\/.+/i.test(url))
  ) {
    gagal.push("Ada URL foto galeri yang tidak valid.");
  }

  if (gagal.length > 0) {
    return {
      valid: false,
      nomorBaris,
      nama: nama || "-",
      alasan: gagal.join(" "),
    };
  }

  return {
    valid: true,
    data: {
      nama,
      harga,
      harga_diskon,
      badge,
      stok,
      kategori,
      foto_url,
      foto_galeri,
      deskripsi,
    },
  };
}

export async function importProdukCSV(formData) {
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Tidak perlu mengubah cookie di luar Server Action.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const file = formData.get("file_csv");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      pesan: "Pilih file CSV terlebih dahulu.",
      berhasil: 0,
      gagal: [],
    };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return {
      success: false,
      pesan: "File harus menggunakan format CSV.",
      berhasil: 0,
      gagal: [],
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return {
      success: false,
      pesan: "Ukuran file CSV maksimal 2 MB.",
      berhasil: 0,
      gagal: [],
    };
  }

  try {
    const teks = (await file.text()).replace(/^\uFEFF/, "");
    const baris = parseCSV(teks);

    if (baris.length < 2) {
      return {
        success: false,
        pesan: "CSV harus memiliki header dan minimal satu baris produk.",
        berhasil: 0,
        gagal: [],
      };
    }

    const header = baris[0].map((item) =>
      item.trim().toLowerCase()
    );

    const headerWajib = ["nama", "harga", "kategori"];

    const headerKurang = headerWajib.filter(
      (item) => !header.includes(item)
    );

    if (headerKurang.length > 0) {
      return {
        success: false,
        pesan: `Kolom wajib tidak ditemukan: ${headerKurang.join(", ")}`,
        berhasil: 0,
        gagal: [],
      };
    }

    if (new Set(header).size !== header.length) {
      return {
        success: false,
        pesan: "CSV memiliki nama kolom yang duplikat.",
        berhasil: 0,
        gagal: [],
      };
    }

    const hasilValidasi = [];
    const daftarGagal = [];

    for (let i = 1; i < baris.length; i++) {
      const nilaiBaris = baris[i];

      if (nilaiBaris.length !== header.length) {
        daftarGagal.push({
          nomorBaris: i + 1,
          nama: "-",
          alasan: "Jumlah kolom tidak sesuai dengan header CSV.",
        });
        continue;
      }

      const objek = {};

      header.forEach((namaKolom, index) => {
        objek[namaKolom] = nilaiBaris[index] ?? "";
      });

      const hasil = validasiBaris(objek, i + 1);

      if (hasil.valid) {
        hasilValidasi.push(hasil.data);
      } else {
        daftarGagal.push(hasil);
      }
    }

    let jumlahBerhasil = 0;

    if (hasilValidasi.length > 0) {
      const supabase = createSupabaseServerClient();

      const { error } = await supabase
        .from("produk")
        .insert(hasilValidasi);

      if (error) {
        return {
          success: false,
          pesan: `Gagal menyimpan data: ${error.message}`,
          berhasil: 0,
          gagal: [
            ...daftarGagal,
            ...hasilValidasi.map((produk, index) => ({
              nomorBaris: index + 2,
              nama: produk.nama,
              alasan: "Gagal disimpan ke database.",
            })),
          ],
        };
      }

      jumlahBerhasil = hasilValidasi.length;
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      pesan: "Proses import CSV selesai.",
      berhasil: jumlahBerhasil,
      gagal: daftarGagal,
    };
  } catch (error) {
    return {
      success: false,
      pesan: error.message || "Terjadi kesalahan saat membaca CSV.",
      berhasil: 0,
      gagal: [],
    };
  }
}
