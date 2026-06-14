/**
 * POST /api/translate-voice
 *
 * Uses the Gemini Live API (WebSocket) to transcribe an audio clip and
 * translate it — the same engine as the realtime meeting agent but as a
 * one-shot request.
 *
 * Accepts base64-encoded 16 kHz mono 16-bit signed PCM audio (captured via
 * AudioContext / ScriptProcessorNode on the client).
 *
 * Body:
 *   { audio: string,        // base64 PCM data
 *     sourceLang: string,   // BCP-47 source language code, e.g. "en"
 *     targetLang: string }  // BCP-47 target language code, e.g. "fr"
 *
 * Returns:
 *   { transcription: string,
 *     translation: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality, Session } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface TranslateVoiceBody {
  audio?: string;
  mimeType?: string;
  sourceLang?: string;
  targetLang?: string;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  // ── Parse & validate ──────────────────────────────────────────────

  let body: TranslateVoiceBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { audio, mimeType, sourceLang, targetLang } = body;
  if (!audio || !sourceLang || !targetLang) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: audio, sourceLang, targetLang",
      },
      { status: 400 },
    );
  }

  // Reject anything too large — 3 MB raw PCM ≈ ~95 s of audio @ 16 kHz
  if (audio.length > 5_000_000) {
    return NextResponse.json(
      { error: "Audio too large (max ~95 seconds)" },
      { status: 400 },
    );
  }

  // ── Connect to Gemini Live API ────────────────────────────────────

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const result = await new Promise<{
    transcription: string;
    translation: string;
  }>((resolve, reject) => {
    let transcription = "";
    let translation = "";
    let session: Session | null = null;
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function finish() {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      try {
        session?.close();
      } catch {
        // ignore close errors
      }
      resolve({
        transcription: transcription.trim(),
        translation: translation.trim(),
      });
    }

    function fail(err: unknown) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      try {
        session?.close();
      } catch {
        // ignore close errors
      }
      reject(
        err instanceof Error ? err : new Error(String(err)),
      );
    }

    ai.live
      .connect({
        model: "models/gemini-3.5-live-translate-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          translationConfig: {
            targetLanguageCode: targetLang,
            echoTargetLanguage: true,
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg) => {
            if (resolved) return;

            // Source-language transcription (user's speech as text)
            if (msg.serverContent?.inputTranscription?.text) {
              transcription = msg.serverContent.inputTranscription.text;
            }

            // Target-language translation (output as text)
            if (msg.serverContent?.outputTranscription?.text) {
              translation = msg.serverContent.outputTranscription.text;
            }

            // Model turn complete → we have everything
            if (msg.serverContent?.turnComplete) {
              finish();
            }
          },
          onerror: (e) => fail(new Error(e.message)),
          onclose: () => finish(),
        },
      })
      .then((s) => {
        session = s;

        // Send audio as realtime input
        session.sendRealtimeInput({
          audio: {
            data: audio,
            mimeType: mimeType || "audio/pcm;rate=16000",
          },
        });

        // Signal that the user is done speaking
        session.sendClientContent({ turnComplete: true });
      })
      .catch(fail);

    // 30-second safety timeout
    timeoutId = setTimeout(() => finish(), 30_000);
  });

  // If we got nothing useful, return a clear error
  if (!result.transcription && !result.translation) {
    return NextResponse.json(
      { error: "Eburon returned an empty response" },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
