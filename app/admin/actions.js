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
  const passwordBaru = formData.get("password_baru");
  const konfirmasiPassword = formData.get("konfirmasi_password");

  if (!passwordBaru || !konfirmasiPassword) {
    redirect("/admin/password?error=Semua%20kolom%20wajib%20diisi");
  }

  if (String(passwordBaru).length < 8) {
    redirect("/admin/password?error=Password%20minimal%208%20karakter");
  }

  if (String(passwordBaru) !== String(konfirmasiPassword)) {
    redirect("/admin/password?error=Konfirmasi%20password%20tidak%20sama");
  }

  const supabase = await createSupabaseAuthClient();

  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { error } = await supabase.auth.updateUser({
    password: String(passwordBaru),
  });

  if (error) {
    redirect(`/admin/password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/password?success=Password%20berhasil%20diubah");
}export async function tambahProdukAdmin(formData) {
  const supabase = await createSupabaseAuthClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const nama = String(formData.get("nama") || "").trim();
  const harga = Number(formData.get("harga"));
  const kategori = String(formData.get("kategori") || "").trim();
  const foto_url = String(formData.get("foto_url") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim();

  if (!nama || !Number.isFinite(harga) || harga < 0) {
    redirect("/admin/produk/baru?error=Data%20produk%20tidak%20valid");
  }

  const { error } = await supabase.from("produk").insert({
    nama,
    harga,
    kategori,
    foto_url,
    deskripsi,
  });

  if (error) {
    redirect(
      `/admin/produk/baru?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin");
}
export async function updateProdukAdmin(id, formData) {
  const supabase = await createSupabaseAuthClient();

  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { error } = await supabase
    .from("produk")
    .update({
      nama: String(formData.get("nama")),
      harga: Number(formData.get("harga")),
      kategori: String(formData.get("kategori") || ""),
      foto_url: String(formData.get("foto_url") || ""),
      deskripsi: String(formData.get("deskripsi") || ""),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/produk/${id}/ubah?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin");
}

