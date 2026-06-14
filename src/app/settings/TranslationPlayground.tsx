"use client";

import { useState, useRef, useCallback } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

/**
 * Translation test playground using sample audio.
 * Plays the original at 25% volume and translated output at 100%.
 */
export default function TranslationPlayground({ voice }: { voice: string }) {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originalAudioRef = useRef<HTMLAudioElement | null>(null);

  const sourceName = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang;
  const targetName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang;

  const startTranslate = useCallback(async () => {
    setError(null);
    setTranscription(null);
    setTranslation(null);
    setTranscribing(true);

    // Load and play original audio at 25%
    const original = new Audio("/sample-audio/sample-audio.mp3");
    original.volume = 0.25;
    original.loop = false;
    originalAudioRef.current = original;
    original.play().catch(() => {});

    try {
      // Fetch the audio file and send to translate API
      const audioRes = await fetch("/sample-audio/sample-audio.mp3");
      const audioBlob = await audioRes.blob();

      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Send to translate API
      const res = await fetch("/api/translate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: audioBase64,
          mimeType: "audio/mp3",
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setTranscription(data.transcription || null);
      setTranslation(data.translation || null);

      // Play translated text via TTS at 100%
      if (data.translation) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.translation);
        utterance.lang = targetLang;
        utterance.volume = 1.0;
        utterance.rate = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const match = voices.find((v) => v.lang.startsWith(targetLang));
        if (match) utterance.voice = match;

        utterance.onerror = () => setError("Speech playback failed.");
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranscribing(false);
      original.pause();
    }
  }, [sourceLang, targetLang]);

  const replayTranslation = useCallback(() => {
    if (!translation) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = targetLang;
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(targetLang));
    if (match) utterance.voice = match;
    window.speechSynthesis.speak(utterance);
  }, [translation, targetLang]);

  return (
    <div className="settings-playground">
      <h3 className="settings-playground-title">Translation Test</h3>
      <p className="settings-playground-desc">
        Test real-time translation using a sample audio clip. Original plays at
        25% volume, translated speech at 100%.
      </p>

      {/* Language selectors */}
      <div className="settings-playground-row">
        <div className="settings-playground-field">
          <label className="settings-label">Source</label>
          <select
            className="settings-select"
            title="Source Language"
            value={sourceLang}
            onChange={(e) => { setSourceLang(e.target.value); setTranscription(null); setTranslation(null); }}
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
        <div className="settings-playground-arrow">→</div>
        <div className="settings-playground-field">
          <label className="settings-label">Target</label>
          <select
            className="settings-select"
            title="Target Language"
            value={targetLang}
            onChange={(e) => { setTargetLang(e.target.value); setTranscription(null); setTranslation(null); }}
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Start button */}
      <div className="settings-playground-voice-area">
        <button
          className="settings-playground-record-btn"
          onClick={startTranslate}
          disabled={transcribing}
        >
          <span className="settings-playground-record-icon">
            {transcribing ? (
              <div className="settings-playground-spinner" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </span>
        </button>
        <p className="settings-playground-voice-hint">
          {transcribing ? "Translating…" : translation ? "Tap to re-translate" : "Start translation test"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="settings-playground-error">
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {translation && (
        <div className="settings-playground-result">
          <div className="settings-playground-result-header">
            <span className="settings-label">{sourceName} → {targetName}</span>
            <button className="settings-playground-play-btn" onClick={replayTranslation}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              Play translation
            </button>
          </div>

          {transcription && (
            <div className="settings-playground-transcription">
              <span className="settings-playground-trans-label">Transcription ({sourceName}):</span>
              <p className="settings-playground-trans-text">{transcription}</p>
            </div>
          )}

          <div className="settings-playground-translation">
            <span className="settings-playground-trans-label">
              Translation ({targetName}) · Voice: {voice}
            </span>
            <p className="settings-playground-trans-text">{translation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
