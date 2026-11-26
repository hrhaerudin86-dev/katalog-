import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserWithRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sirkula_buyer_token")?.value;
  if (!token) return null;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return {
    ...user,
    role: roleRow?.role || "buyer",
  };
}

export async function requireRole(allowedRoles, currentPath = "/") {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect(`/akun/masuk?next=${encodeURIComponent(currentPath)}`);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(`/?error=akses_ditolak`);
  }

  return user;
}