import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiWithRetry } from "@/lib/gemini-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL = "gemini-3.5-flash";

/**
 * POST /api/translate-text
 *
 * Translates a snippet of text using the Gemini API (text generation, not
 * the Live streaming endpoint). Accepts:
 *
 *   { text: string, sourceLang: string, targetLang: string }
 *
 * Returns:
 *
 *   { translatedText: string }
 */
export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  let body: { text?: string; sourceLang?: string; targetLang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { text, sourceLang, targetLang } = body;
  if (!text || !sourceLang || !targetLang) {
    return NextResponse.json(
      { error: "Missing required fields: text, sourceLang, targetLang" },
      { status: 400 },
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Text too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  const prompt = `You are a precise translator. Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, nothing else — no explanations, no quotes, no commentary.

Text to translate:
${text}`;

  try {
    const response = await fetchGeminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
          },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(
        "Eburon API error:",
        response.status,
        errBody.slice(0, 500),
      );
      return NextResponse.json(
        { error: `Eburon API returned ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translated) {
      console.error("Unexpected Eburon response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: "Eburon returned an empty response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ translatedText: translated.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("translate-text route error:", msg);
    return NextResponse.json(
      { error: "Translation request failed" },
      { status: 502 },
    );
  }
}
