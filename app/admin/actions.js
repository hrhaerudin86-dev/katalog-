
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

function ambilFotoGaleri(formData) {
  return String(formData.get("foto_galeri") || "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 10);
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

  if (userError || !user) {
    redirect("/admin/login");
  }

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

  if (userError || !user) {
    redirect("/admin/login");
  }

  const nama = String(formData.get("nama") || "").trim();
  const harga = Number(formData.get("harga"));
  const kategori = String(formData.get("kategori") || "").trim();
  const foto_url = String(formData.get("foto_url") || "").trim();
  const foto_galeri = ambilFotoGaleri(formData);
  const deskripsi = String(formData.get("deskripsi") || "").trim();

  if (!nama || !Number.isFinite(harga) || harga < 0) {
    redirect("/admin/produk/baru?error=Data%20produk%20tidak%20valid");
  }

  const { error } = await supabase.from("produk").insert({
    nama,
    harga,
    kategori,
    foto_url,
    foto_galeri,
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

  if (userError || !user) {
    redirect("/admin/login");
  }

  const nama = String(formData.get("nama") || "").trim();
  const harga = Number(formData.get("harga"));

  if (!nama || !Number.isFinite(harga) || harga < 0) {
    redirect(`/admin/produk/${id}/ubah?error=Data%20produk%20tidak%20valid`);
  }

  const { error } = await supabase
    .from("produk")
    .update({
      nama,
      harga,
      kategori: String(formData.get("kategori") || "").trim(),
      foto_url: String(formData.get("foto_url") || "").trim(),
      foto_galeri: ambilFotoGaleri(formData),
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

  if (userError || !user) {
    redirect("/admin/login");
  }

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
