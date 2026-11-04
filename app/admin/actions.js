
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET_FOTO = "produk";
const MAKSIMAL_UKURAN = 5 * 1024 * 1024;

const TIPE_FOTO = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

async function uploadFoto(file) {
  if (!file || file.size === 0) {
    return { url: null, error: null };
  }

  if (!TIPE_FOTO[file.type]) {
    return {
      url: null,
      error: "Format foto harus JPG, PNG, atau WebP.",
    };
  }

  if (file.size > MAKSIMAL_UKURAN) {
    return {
      url: null,
      error: "Ukuran setiap foto maksimal 5 MB.",
    };
  }

  const supabaseAdmin = createSupabaseServerClient();
  const namaFile = `${crypto.randomUUID()}.${TIPE_FOTO[file.type]}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_FOTO)
    .upload(namaFile, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_FOTO)
    .getPublicUrl(namaFile);

  return { url: data.publicUrl, error: null };
}

async function prosesFoto(formData, fotoUtamaLama = "") {
  let foto_url = String(formData.get("foto_url") || "").trim();
  const fileUtama = formData.get("foto_utama");

  if (fileUtama instanceof File && fileUtama.size > 0) {
    const hasil = await uploadFoto(fileUtama);

    if (hasil.error) {
      return { error: hasil.error };
    }

    foto_url = hasil.url;
  } else if (!foto_url) {
    foto_url = fotoUtamaLama;
  }

  const foto_galeri = String(formData.get("foto_galeri") || "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);

  const fileGaleri = formData.getAll("foto_galeri_file");

  for (const file of fileGaleri) {
    if (!(file instanceof File) || file.size === 0) continue;

    const hasil = await uploadFoto(file);

    if (hasil.error) {
      return { error: hasil.error };
    }

    foto_galeri.push(hasil.url);
  }

  if (foto_galeri.length > 10) {
    return { error: "Jumlah foto galeri maksimal 10 gambar." };
  }

  return {
    foto_url,
    foto_galeri,
    error: null,
  };
}

function ambilStok(formData) {
  const nilaiStok = String(formData.get("stok") ?? "1").trim();
  const stok = Number(nilaiStok);

  if (nilaiStok === "" || !Number.isInteger(stok) || stok < 0) {
    return null;
  }

  return stok;
}

function ambilHargaDiskon(formData, harga) {
  const nilaiDiskon = String(formData.get("harga_diskon") ?? "").trim();

  if (nilaiDiskon === "") return null;

  const hargaDiskon = Number(nilaiDiskon);

  if (
    !Number.isSafeInteger(hargaDiskon) ||
    hargaDiskon <= 0 ||
    hargaDiskon >= harga
  ) {
    return undefined;
  }

  return hargaDiskon;
}

function ambilBadge(formData) {
  const badge = String(formData.get("badge") || "").trim();

  if (!badge) return null;
  if (!["Baru", "Terlaris"].includes(badge)) return undefined;

  return badge;
}

// Menyimpan nilai form ketika validasi gagal
function buatUrlErrorForm(path, formData, errorNama, errorHarga) {
  const params = new URLSearchParams();

  params.set("errorNama", errorNama || "");
  params.set("errorHarga", errorHarga || "");

  for (const field of [
    "nama",
    "harga",
    "harga_diskon",
    "badge",
    "stok",
    "kategori",
    "foto_url",
    "foto_galeri",
    "deskripsi",
  ]) {
    params.set(field, String(formData.get(field) || ""));
  }

  return `${path}?${params.toString()}`;
}

export async function loginAdmin(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    redirect("/admin/login?error=Email%20dan%20password%20wajib%20diisi");
  }

  const supabase = await createSupabaseAuthClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(email),
    password: String(password),
  });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function gantiPasswordAdmin(formData) {
  const passwordBaru = String(formData.get("password_baru") || "");
  const konfirmasiPassword = String(formData.get("konfirmasi_password") || "");

  if (!passwordBaru || !konfirmasiPassword) {
    redirect("/admin/password?error=Semua%20kolom%20wajib%20diisi");
  }

  if (passwordBaru.length < 8) {
    redirect("/admin/password?error=Password%20minimal%208%20karakter");
  }

  if (passwordBaru !== konfirmasiPassword) {
    redirect("/admin/password?error=Konfirmasi%20password%20tidak%20sama");
  }

  const supabase = await createSupabaseAuthClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (error) {
    redirect(`/admin/password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/password?success=Password%20berhasil%20diubah");
}

export async function tambahProdukAdmin(formData) {
  const supabase = await createSupabaseAuthClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  const nama = String(formData.get("nama") || "").trim();
  const nilaiHarga = String(formData.get("harga") ?? "").trim();
  const harga = Number(nilaiHarga);
  const stok = ambilStok(formData);
  const harga_diskon = ambilHargaDiskon(formData, harga);
  const badge = ambilBadge(formData);
  const kategori = String(formData.get("kategori") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim();

  const errorNama = !nama ? "Nama produk wajib diisi." : "";
  const errorHarga =
    nilaiHarga === "" ||
    !Number.isSafeInteger(harga) ||
    harga <= 0
      ? "Harga harus berupa angka positif."
      : "";

  if (errorNama || errorHarga) {
    redirect(
      buatUrlErrorForm(
        "/admin/produk/baru",
        formData,
        errorNama,
        errorHarga
      )
    );
  }

  if (stok === null) {
    redirect("/admin/produk/baru?error=Stok%20harus%20berupa%20bilangan%20bulat%20minimal%200");
  }

  if (harga_diskon === undefined) {
    redirect("/admin/produk/baru?error=Harga%20diskon%20harus%20lebih%20kecil%20dari%20harga%20normal");
  }

  if (badge === undefined) {
    redirect("/admin/produk/baru?error=Pilihan%20badge%20tidak%20valid");
  }

  let foto;
  try {
    foto = await prosesFoto(formData);
  } catch {
    redirect("/admin/produk/baru?error=Gagal%20mengunggah%20foto");
  }

  if (foto.error) {
    redirect(`/admin/produk/baru?error=${encodeURIComponent(foto.error)}`);
  }

  const { error } = await supabase.from("produk").insert({
    nama,
    harga,
    harga_diskon,
    badge,
    stok,
    kategori,
    foto_url: foto.foto_url || "",
    foto_galeri: foto.foto_galeri,
    deskripsi,
  });

  if (error) {
    redirect(`/admin/produk/baru?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function updateProdukAdmin(id, formData) {
  const supabase = await createSupabaseAuthClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  const nama = String(formData.get("nama") || "").trim();
  const nilaiHarga = String(formData.get("harga") ?? "").trim();
  const harga = Number(nilaiHarga);
  const stok = ambilStok(formData);
  const harga_diskon = ambilHargaDiskon(formData, harga);
  const badge = ambilBadge(formData);

  const errorNama = !nama ? "Nama produk wajib diisi." : "";
  const errorHarga =
    nilaiHarga === "" ||
    !Number.isSafeInteger(harga) ||
    harga <= 0
      ? "Harga harus berupa angka positif."
      : "";

  if (errorNama || errorHarga) {
    redirect(
      buatUrlErrorForm(
        `/admin/produk/${id}/ubah`,
        formData,
        errorNama,
        errorHarga
      )
    );
  }

  if (stok === null) {
    redirect(`/admin/produk/${id}/ubah?error=Stok%20harus%20berupa%20bilangan%20bulat%20minimal%200`);
  }

  if (harga_diskon === undefined) {
    redirect(`/admin/produk/${id}/ubah?error=Harga%20diskon%20harus%20lebih%20kecil%20dari%20harga%20normal`);
  }

  if (badge === undefined) {
    redirect(`/admin/produk/${id}/ubah?error=Pilihan%20badge%20tidak%20valid`);
  }

  let foto;
  try {
    foto = await prosesFoto(formData);
  } catch {
    redirect(`/admin/produk/${id}/ubah?error=Gagal%20mengunggah%20foto`);
  }

  if (foto.error) {
    redirect(`/admin/produk/${id}/ubah?error=${encodeURIComponent(foto.error)}`);
  }

  const { error } = await supabase
    .from("produk")
    .update({
      nama,
      harga,
      harga_diskon,
      badge,
      stok,
      kategori: String(formData.get("kategori") || "").trim(),
      foto_url: foto.foto_url || "",
      foto_galeri: foto.foto_galeri,
      deskripsi: String(formData.get("deskripsi") || "").trim(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/produk/${id}/ubah?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function hapusProdukAdmin(id) {
  const supabase = await createSupabaseAuthClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  const { data, error } = await supabase
    .from("produk")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  if (!data || data.length === 0) {
    redirect("/admin?error=Produk%20tidak%20ditemukan");
  }

  redirect("/admin");
}

export async function toggleStatusProduk(formData) {
  const supabaseAuth = await createSupabaseAuthClient();

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const id = Number(formData.get("id"));

  if (!Number.isSafeInteger(id) || id <= 0) {
    redirect("/admin?error=ID%20produk%20tidak%20valid");
  }

  const supabase = createSupabaseServerClient();

  const { data: produk, error: cekError } = await supabase
    .from("produk")
    .select("id, aktif")
    .eq("id", id)
    .maybeSingle();

  if (cekError || !produk) {
    redirect("/admin?error=Produk%20tidak%20ditemukan");
  }

  const { error } = await supabase
    .from("produk")
    .update({ aktif: !produk.aktif })
    .eq("id", id);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);

  redirect("/admin?success=Status%20produk%20berhasil%20diubah");
}
