"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ambilAdminAktif() {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  return user;
}

function buatRedirect(pesan, tipe = "error") {
  redirect(`/admin/akun?${tipe}=${encodeURIComponent(pesan)}`);
}

// Menambahkan akun admin baru
export async function tambahAkunAdmin(formData) {
  await ambilAdminAktif();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    buatRedirect("Format email tidak valid.");
  }

  if (password.length < 8) {
    buatRedirect("Password minimal 8 karakter.");
  }

  const supabaseAdmin = createSupabaseServerClient();

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    buatRedirect(error.message);
  }

  revalidatePath("/admin/akun");
  buatRedirect("Akun admin berhasil ditambahkan.", "success");
}

// Mengaktifkan atau menonaktifkan akun admin
export async function ubahStatusAkunAdmin(formData) {
  const adminAktif = await ambilAdminAktif();

  const userId = String(formData.get("user_id") || "");
  const status = String(formData.get("status") || "");

  if (!userId || !["aktif", "nonaktif"].includes(status)) {
    buatRedirect("Data akun tidak valid.");
  }

  if (userId === adminAktif.id) {
    buatRedirect("Anda tidak dapat menonaktifkan akun sendiri.");
  }

  const supabaseAdmin = createSupabaseServerClient();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      ban_duration: status === "nonaktif" ? "876000h" : "none",
    }
  );

  if (error) {
    buatRedirect(error.message);
  }

  revalidatePath("/admin/akun");
  buatRedirect(
    status === "nonaktif"
      ? "Akun admin berhasil dinonaktifkan."
      : "Akun admin berhasil diaktifkan.",
    "success"
  );
}

// Menghapus akun admin lain
export async function hapusAkunAdmin(formData) {
  const adminAktif = await ambilAdminAktif();

  const userId = String(formData.get("user_id") || "");

  if (!userId) {
    buatRedirect("ID akun tidak valid.");
  }

  if (userId === adminAktif.id) {
    buatRedirect("Anda tidak dapat menghapus akun sendiri.");
  }

  const supabaseAdmin = createSupabaseServerClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    buatRedirect(error.message);
  }

  revalidatePath("/admin/akun");
  buatRedirect("Akun admin berhasil dihapus.", "success");
}