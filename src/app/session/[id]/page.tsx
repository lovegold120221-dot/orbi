"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PICKER_LANGUAGES } from "@/lib/languages";
import { useUser } from "@/context/UserContext";

const STORAGE_KEY_NAME = "lt.displayName";
const STORAGE_KEY_LANG = "lt.lang";

function getSessionItem(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

export default function PreFlightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, updateProfile } = useUser();

  const [displayName, setDisplayName] = useState("");
  const [lang, setLang] = useState<string>("en");
  const [shareCopied, setShareCopied] = useState(false);

  // Hydrate from sessionStorage + profile after mount so server & client
  // first render are identical (prevents hydration mismatch on disabled attr).
  useEffect(() => {
    setTimeout(() => {
      const savedName = getSessionItem(STORAGE_KEY_NAME);
      const savedLang = getSessionItem(STORAGE_KEY_LANG);
      if (savedName) setDisplayName(savedName);
      if (savedLang) setLang(savedLang);
      if (!savedName && profile?.name) setDisplayName(profile.name);
      if (!savedLang && profile?.default_language) setLang(profile.default_language);
    }, 0);
  }, [profile]);

  async function handleJoin() {
    if (!displayName.trim()) return;
    window.sessionStorage.setItem(STORAGE_KEY_NAME, displayName.trim());
    window.sessionStorage.setItem(STORAGE_KEY_LANG, lang);
    
    if (profile && (profile.name !== displayName.trim() || profile.default_language !== lang)) {
      updateProfile({ name: displayName.trim(), default_language: lang });
    }

    router.push(`/session/${id}/room`);
  }

  async function copyInviteLink() {
    const url = `${window.location.origin}/session/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ignored
    }
  }

  return (
    <div className="page page-centered">
      <div className="entry-panel panel-centered">
        <div className="auth-brand mb-24">
          <div className="auth-logo-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-eburon.svg" alt="Eburon AI" className="auth-brand-logo" />
          </div>
          <span>Orbit Meeting</span>
        </div>
        <h1 className="display display-lg enter mb-8">
          Join the call
        </h1>
        <p
          className="body enter-d1 mb-32"
        >
          Pick your language — that&apos;s what you&apos;ll speak and what you&apos;ll
          hear everyone else in.
        </p>

        <div className="enter-d2 flex-col gap-20 mb-32">
          <label className="label block">
            Your name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jesse"
              autoFocus
              className="select-field mt-8 no-bg pr-16"
              maxLength={40}
            />
          </label>

          <label className="label block">
            Language
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="select-field mt-8"
            >
              {PICKER_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="enter-d3 flex-col gap-12">
          <button
            className="btn btn-dark"
            onClick={handleJoin}
            disabled={!displayName.trim()}
            id="join-btn"
          >
            Join the call
          </button>
          <button
            className="btn btn-outline"
            onClick={copyInviteLink}
          >
            {shareCopied ? "Link copied!" : "Copy invite link"}
          </button>
        </div>

        <p className="mono enter-d4 mt-32">
          Camera and mic stay off until you turn them on.
        </p>
      </div>
    </div>
  );
}
