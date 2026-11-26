"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UploadBuktiKomplain({ orderId }) {
  const [urlBukti, setUrlBukti] = useState("");
  const [statusUpload, setStatusUpload] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusUpload("Mengunggah bukti...");

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${orderId}/${Date.now()}.${ext}`;
      const { error } = await supabaseClient.storage
        .from("complaint-evidence")
        .upload(path, file);

      if (error) throw error;

      const { data } = supabaseClient.storage
        .from("complaint-evidence")
        .getPublicUrl(path);

      setUrlBukti(data?.publicUrl || "");
      setStatusUpload("Bukti siap dilampirkan.");
    } catch (err) {
      console.error(err);
      setStatusUpload("Gagal upload (cek bucket complaint-evidence di Supabase).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name="evidence_url" value={urlBukti} />
      <label className="text-xs font-semibold">Upload Foto / Video Bukti</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="rounded-xl border border-garis bg-latar px-3 py-2 text-xs"
      />
      {statusUpload && (
        <span className="text-xs font-medium text-utama">
          {loading ? "Mengunggah..." : statusUpload}
        </span>
      )}
    </div>
  );
}