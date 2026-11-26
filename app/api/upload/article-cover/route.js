import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function POST(request) {
  try {
    await requireRole(["admin"], "/admin/artikel");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Berkas gambar tidak ditemukan." }, { status: 400 });
    }

    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Berkas harus berupa file gambar." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name || "cover.jpg").split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from("article-covers")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from("article-covers")
      .getPublicUrl(filePath);

    const url = String(publicData?.publicUrl || "").trim();
    if (!url) {
      return NextResponse.json({ error: "URL publik gambar gagal dibuat." }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Gagal mengunggah gambar cover." },
      { status: 500 }
    );
  }
}