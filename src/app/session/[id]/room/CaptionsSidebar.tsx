"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useRemoteParticipants,
  useTextStream,
} from "@livekit/components-react";
import { getLanguageByCode } from "@/lib/languages";

const TRANSLATION_TOPIC = "lk.translation";

export default function CaptionsSidebar({
  open,
  onClose,
  myLang,
  peerLangs,
}: {
  open: boolean;
  onClose: () => void;
  myLang: string;
  peerLangs: Map<string, string | undefined>;
}) {
  const { textStreams } = useTextStream(TRANSLATION_TOPIC);
  const remotes = useRemoteParticipants();
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of remotes) {
      map.set(p.identity, p.name || p.identity);
    }
    return map;
  }, [remotes]);

  // Group source + translation text by speaker identity
  const entries = useMemo(() => {
    const matching = textStreams
      .filter((s) => s.streamInfo.attributes?.target_lang === myLang)
      .sort((a, b) => a.streamInfo.timestamp - b.streamInfo.timestamp);

    type Entry = {
      key: string;
      sourceIdentity: string;
      sourceText: string;
      translatedText: string;
      sourceLang: string | undefined;
    };
    const out: Entry[] = [];
    const openIdxBySource = new Map<string, number>();

    for (const s of matching) {
      const source =
        s.streamInfo.attributes?.source_identity ?? s.participantInfo.identity;
      const isSource = s.streamInfo.attributes?.kind === "source";
      const isFinal = s.streamInfo.attributes?.final === "true";
      const text = s.text.trim();

      if (!text) {
        if (isFinal) openIdxBySource.delete(source);
        continue;
      }

      const openIdx = openIdxBySource.get(source);
      if (openIdx !== undefined) {
        // Append to open entry
        if (isSource) {
          out[openIdx].sourceText = `${out[openIdx].sourceText} ${text}`.trim();
        } else {
          out[openIdx].translatedText = `${out[openIdx].translatedText} ${text}`.trim();
        }
      } else {
        // New entry
        out.push({
          key: `entry-${out.length}`,
          sourceIdentity: source,
          sourceText: isSource ? text : "",
          translatedText: isSource ? "" : text,
          sourceLang: peerLangs.get(source),
        });
        openIdxBySource.set(source, out.length - 1);
      }

      if (isFinal) openIdxBySource.delete(source);
    }
    return out;
  }, [textStreams, myLang, peerLangs]);

  // Auto-scroll
  useEffect(() => {
    if (!open || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [entries, open]);

  const myLangInfo = getLanguageByCode(myLang);

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>Captions {myLangInfo && `· ${myLangInfo.flag} ${myLangInfo.name}`}</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close captions">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div ref={bodyRef} className="sidebar-body">
        {entries.length === 0 ? (
          <div className="captions-empty">
            No captions yet. Translation transcripts will appear here as people speak.
          </div>
        ) : (
          entries.map((entry) => (
            <div className="captions-entry" key={entry.key}>
              {entry.sourceText && (
                <p className="captions-text">
                  <strong>{names.get(entry.sourceIdentity) ?? entry.sourceIdentity}:</strong>{" "}
                  {entry.sourceText}
                </p>
              )}
              {entry.translatedText && (
                <p className="captions-text captions-text--translated">
                  <strong>Orbit Translator:</strong> {entry.translatedText}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
