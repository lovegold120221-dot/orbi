"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import "@livekit/components-styles";
import InCall from "./InCall";

const STORAGE_KEY_NAME = "lt.displayName";
const STORAGE_KEY_LANG = "lt.lang";

function getSessionItem(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

interface TokenResponse {
  token: string;
  serverUrl: string;
}

export default function RoomClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identity] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `peer-${crypto.randomUUID().slice(0, 8)}`
      : `peer-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [displayName] = useState<string>(
    () => getSessionItem(STORAGE_KEY_NAME) ?? "",
  );
  const [initialLang] = useState<string>(
    () => getSessionItem(STORAGE_KEY_LANG) ?? "en",
  );

  // Pull name + lang chosen in the pre-flight screen. If missing, send the
  // user back to the pre-flight so they can pick.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const name = window.sessionStorage.getItem(STORAGE_KEY_NAME);
    const lang = window.sessionStorage.getItem(STORAGE_KEY_LANG);
    if (!name || !lang) {
      router.replace(`/session/${sessionId}`);
    }
  }, [router, sessionId]);

  // Mint a LiveKit token. For breakout rooms, use pre-generated token if available.
  useEffect(() => {
    if (!displayName) return;

    // Check if this is a breakout room with a pre-generated token
    const breakoutToken = typeof window !== 'undefined' ? window.sessionStorage.getItem("orbit.breakout-token") : null;
    const breakoutUrl = typeof window !== 'undefined' ? window.sessionStorage.getItem("orbit.breakout-server-url") : null;

    if (breakoutToken && breakoutUrl) {
      setToken(breakoutToken);
      setServerUrl(breakoutUrl);
      // Clean up so reconnects use normal flow
      window.sessionStorage.removeItem("orbit.breakout-token");
      window.sessionStorage.removeItem("orbit.breakout-server-url");
      return;
    }

    const isHost = typeof window !== 'undefined' && window.sessionStorage.getItem("orbitHostRoom") === sessionId;
    const url = `/api/token?room=${encodeURIComponent(
      sessionId,
    )}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(displayName)}${isHost ? '&host=true' : ''}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Token request failed (${res.status})`);
        }
        return res.json() as Promise<TokenResponse>;
      })
      .then((data) => {
        setToken(data.token);
        setServerUrl(data.serverUrl);
      })
      .catch((err) => setError(err.message));
  }, [sessionId, identity, displayName]);

  function handleLeave() {
    router.push("/");
  }

  if (error) {
    return (
      <div className="page text-center">
        <div className="container">
          <h1 className="display display-md mb-16">
            Couldn&apos;t join the call
          </h1>
          <p className="body mb-24">
            {error}
          </p>
          <button className="btn btn-outline" onClick={() => router.push("/")}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="page text-center">
        <div className="container">
          <div className="spinner mx-auto mb-16" />
          <p className="mono">Connecting…</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      // Camera + mic default OFF (grill Q12); user opts in via the control bar.
      video={false}
      audio={false}
      connect={true}
      onDisconnected={handleLeave}
      data-lk-theme="default"
      className="h-100vh bg-bg"
    >
      <InCall initialLang={initialLang} onLeave={handleLeave} />
      <RoomAudioRenderer />
      {/* Browsers block audio playback until a user gesture. A listener whose
          mic stays off never triggers that gesture, so inbound translation
          audio would silently never play. StartAudio renders only while
          playback is blocked and calls room.startAudio() on click. */}
      <StartAudio
        label="🔊 Tap to enable translated audio"
        className="btn start-audio-fixed"
      />
    </LiveKitRoom>
  );
}
