
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function generateDeskripsiAI(nama, kategori) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Silakan login sebagai admin terlebih dahulu.",
      };
    }

    const namaProduk = String(nama || "").trim();
    const kategoriProduk = String(kategori || "").trim();

    if (!namaProduk || !kategoriProduk) {
      return {
        success: false,
        error: "Nama produk dan kategori wajib diisi.",
      };
    }

    if (namaProduk.length > 150 || kategoriProduk.length > 100) {
      return {
        success: false,
        error: "Nama produk atau kategori terlalu panjang.",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Konfigurasi Gemini API belum tersedia di server.");

      return {
        success: false,
        error: "Layanan AI sedang tidak tersedia. Silakan hubungi admin.",
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Kamu adalah penulis deskripsi produk UMKM Indonesia. Tulis deskripsi dalam bahasa Indonesia yang menarik, informatif, alami, dan tidak berlebihan. Jangan mengarang klaim manfaat, sertifikasi, bahan, atau keunggulan yang tidak diberikan.",
              },
            ],
          },
          contents: [
            {
              parts: [
                {
                  text: `Buat deskripsi produk UMKM berikut dalam satu paragraf sekitar 40-70 kata.

Nama produk: ${namaProduk}
Kategori: ${kategoriProduk}

Jangan menambahkan fakta yang tidak diketahui.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
        signal: AbortSignal.timeout(60000),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Gemini API gagal merespons:", {
        status: response.status,
      });

      return {
        success: false,
        error: "Layanan AI gagal memproses permintaan. Silakan coba lagi.",
      };
    }

    const hasil = await response.json();

    const deskripsi = hasil.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!deskripsi) {
      console.error("Gemini API tidak menghasilkan deskripsi yang valid.");

      return {
        success: false,
        error: "AI tidak berhasil menghasilkan deskripsi. Silakan coba lagi.",
      };
    }

    return {
      success: true,
      deskripsi,
    };
  } catch (error) {
    console.error("Terjadi kesalahan saat membuat deskripsi AI:", error);

    return {
      success: false,
      error:
        error.name === "TimeoutError" || error.name === "AbortError"
          ? "Koneksi ke layanan AI terlalu lama. Silakan coba lagi."
          : "Terjadi kesalahan saat menghubungi layanan AI.",
    };
  }
}
