import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Berkas gambar tidak ditemukan." }, { status: 400 });
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
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from("article-covers")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicData?.publicUrl || "" });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Gagal mengunggah gambar cover." },
      { status: 500 }
    );
  }
}