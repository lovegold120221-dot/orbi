"use client";

import { useMemo, useState } from "react";
import {
  useLocalParticipant,
} from "@livekit/components-react";
import { Track, type LocalParticipant, type RemoteParticipant } from "livekit-client";
import { PARTICIPANT_LANG_ATTR } from "@/lib/config";
import { getLanguageByCode } from "@/lib/languages";
import {
  MicOnIcon,
  MicOffIcon,
  CamOnIcon,
  CamOffIcon,
  HandRaiseIcon,
  PinIcon,
  SearchIcon,
  MoreVerticalIcon,
  ScreenShareOnIcon,
  ChatIcon,
} from "./icons";

type Tab = "all" | "speaking" | "raised";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────

export default function ParticipantsPanel({
  localParticipant,
  participants,
  myLang,
  isHost,
  roomName,
  onClose,
  onToggleChat,
  reactions,
}: {
  localParticipant: LocalParticipant | undefined;
  participants: RemoteParticipant[];
  myLang: string;
  isHost: boolean;
  roomName: string;
  onClose: () => void;
  onToggleChat: () => void;
  reactions: Map<string, { emoji: string; ts: number }>;
}) {
  const { microphoneTrack, cameraTrack } = useLocalParticipant();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const micOn = !!microphoneTrack && !microphoneTrack.isMuted;
  const camOn = !!cameraTrack && cameraTrack.source === Track.Source.Camera && !cameraTrack.isMuted;
  const handRaised = localParticipant?.attributes?.orbit_hand === "raised";

  const rows = useMemo(() => {
    return participants.map((p) => ({
      identity: p.identity,
      name: p.name || p.identity,
      initial: (p.name || p.identity).slice(0, 1).toUpperCase(),
      lang: (p.attributes || {})[PARTICIPANT_LANG_ATTR],
      micOn: Array.from(p.audioTrackPublications.values()).some(
        (pub) => pub.source === Track.Source.Microphone && !pub.isMuted
      ),
      camOn: Array.from(p.videoTrackPublications.values()).some(
        (pub) => pub.source === Track.Source.Camera && !pub.isMuted
      ),
      handRaised: (p.attributes || {}).orbit_hand === "raised",
      screenSharing: Array.from(p.trackPublications.values()).some(
        (pub) => pub.source === Track.Source.ScreenShare && !pub.isMuted
      ),
      participant: p,
    }));
  }, [participants]);

  const speakingSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of participants) {
      if (Array.from(p.audioTrackPublications.values()).some(
        (pub) => pub.source === Track.Source.Microphone && !pub.isMuted && pub.track
      )) s.add(p.identity);
    }
    return s;
  }, [participants]);

  const filtered = useMemo(() => {
    let list = rows;
    if (activeTab === "speaking") list = list.filter((r) => speakingSet.has(r.identity));
    else if (activeTab === "raised") list = list.filter((r) => r.handRaised);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return list;
  }, [rows, activeTab, search, speakingSet]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aS = speakingSet.has(a.identity);
      const bS = speakingSet.has(b.identity);
      if (aS && !bS) return -1;
      if (!aS && bS) return 1;
      if (a.handRaised && !b.handRaised) return -1;
      if (!a.handRaised && b.handRaised) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, speakingSet]);

  const totalCount = participants.length + 1;
  const raisedCount = rows.filter((r) => r.handRaised).length;

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>Participants ({totalCount})</span>
        {isHost && (
          <button className="pp-mute-all-btn" onClick={async () => {
            try { await fetch("/api/moderate", { method: "POST", body: JSON.stringify({ action: "muteAll", roomName }) }); }
            catch { alert("Failed to mute all"); }
          }} title="Mute all participants">
            <MicOffIcon />
            <span>Mute All</span>
          </button>
        )}
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      <div className="pp-search-wrap">
        <span className="pp-search-icon"><SearchIcon /></span>
        <input className="pp-search-input" placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="pp-tabs">
        <button className={`pp-tab ${activeTab === "all" ? "pp-tab--active" : ""}`} onClick={() => setActiveTab("all")}>All</button>
        <button className={`pp-tab ${activeTab === "speaking" ? "pp-tab--active" : ""}`} onClick={() => setActiveTab("speaking")}>Speaking</button>
        <button className={`pp-tab ${activeTab === "raised" ? "pp-tab--active" : ""}`} onClick={() => setActiveTab("raised")}>
          Raised{raisedCount > 0 ? ` (${raisedCount})` : ""}
        </button>
      </div>

      <div className="sidebar-body">
        <SelfRow
          name={localParticipant?.name || localParticipant?.identity || "You"}
          initial={(localParticipant?.name || localParticipant?.identity || "Y").slice(0, 1).toUpperCase()}
          micOn={micOn}
          camOn={camOn}
          isHost={isHost}
          onToggleChat={onToggleChat}
          onToggleMic={() => localParticipant?.setMicrophoneEnabled(!micOn)}
          onToggleCam={() => localParticipant?.setCameraEnabled(!camOn)}
        />

        {sorted.length === 0 && (
          <div className="pp-empty">
            {search ? "No matching participants" : activeTab === "raised" ? "No raised hands" : "No participants yet"}
          </div>
        )}

        {sorted.map((row) => (
          <ParticipantRow
            key={row.identity}
            identity={row.identity}
            name={row.name}
            initial={row.initial}
            lang={row.lang}
            micOn={row.micOn}
            camOn={row.camOn}
            handRaised={row.handRaised}
            screenSharing={row.screenSharing}
            participant={row.participant}
            isHost={isHost}
            roomName={roomName}
            expanded={expanded === row.identity}
            onToggle={() => setExpanded(expanded === row.identity ? null : row.identity)}
            myLang={myLang}
            isSpeaking={speakingSet.has(row.identity)}
            reaction={reactions.get(row.identity)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Self Row ──────────────────────────────────────────────────────────

function SelfRow({
  name, initial, micOn, camOn, isHost,
  onToggleMic, onToggleCam, onToggleChat,
}: {
  name: string; initial: string; micOn: boolean; camOn: boolean;
  isHost: boolean;
  onToggleMic: () => void; onToggleCam: () => void;
  onToggleChat: () => void;
}) {
  return (
    <div className="pp-self">
      <div className="pp-self-top">
        <div className="pp-avatar">{initial}</div>
        <div className="pp-self-info">
          <span className="pp-name">{name}</span>
          {isHost && <span className="pp-badge pp-badge--role">Host</span>}
        </div>
        <button
          className={`pp-self-icon-btn ${!micOn ? "pp-self-icon-btn--off" : ""}`}
          onClick={onToggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <MicOnIcon /> : <MicOffIcon />}
        </button>
        <button
          className={`pp-self-icon-btn ${!camOn ? "pp-self-icon-btn--off" : ""}`}
          onClick={onToggleCam}
          title={camOn ? "Turn off camera" : "Turn on camera"}
        >
          {camOn ? <CamOnIcon /> : <CamOffIcon />}
        </button>
        <button
          className="pp-self-icon-btn"
          onClick={onToggleChat}
          title="Public Chat"
        >
          <ChatIcon />
        </button>
      </div>
    </div>
  );
}

// ── Participant Row ───────────────────────────────────────────────────

function ParticipantRow({
  identity, name, initial, lang, micOn, camOn, handRaised, screenSharing,
  participant, isHost, roomName, expanded, onToggle, myLang, isSpeaking,
  reaction,
}: {
  identity: string; name: string; initial: string; lang?: string;
  micOn: boolean; camOn: boolean; handRaised: boolean; screenSharing: boolean;
  participant: RemoteParticipant; isHost: boolean; roomName: string;
  expanded: boolean; onToggle: () => void; myLang: string; isSpeaking: boolean;
  reaction?: { emoji: string; ts: number };
}) {
  const langInfo = lang ? getLanguageByCode(lang) : undefined;
  const needsTranslation = myLang !== "none" && !!lang && lang !== myLang;
  const status = [isSpeaking && "Speaking now", screenSharing && "Screen sharing"].filter(Boolean).join(" · ");

  async function doModerate(action: string) {
    try {
      const res = await fetch("/api/moderate", { method: "POST", body: JSON.stringify({ action, roomName, identity }) });
      if (!res.ok) throw new Error("Moderation failed");
    } catch { alert(`Failed to ${action} participant`); }
  }

  return (
    <div className={`pp-row ${isSpeaking ? "pp-row--speaking" : ""} ${expanded ? "pp-row--expanded" : ""}`}>
      <div className="pp-row-main">
        <div className="pp-row-avatar-wrapper">
          <div className={`pp-row-avatar ${isSpeaking ? "pp-row-avatar--speaking" : ""}`}>
            {initial}
          </div>
          {reaction && (
            <span className="pp-reaction-badge">{reaction.emoji}</span>
          )}
        </div>
        <div className="pp-row-info">
          <div className="pp-row-name-row">
            <span className="pp-name">{name}</span>
            {participant.attributes?.orbit_host === "true" && <span className="pp-badge pp-badge--role">Host</span>}
            {langInfo && (
              <span className="pp-badge pp-badge--lang">
                {langInfo.flag} {needsTranslation ? `→ ${myLang.toUpperCase()}` : langInfo.code.toUpperCase()}
              </span>
            )}
          </div>
          {status && <div className="pp-row-status">{status}</div>}
          <div className="pp-row-icons">
            {micOn ? <MicOnIcon /> : <MicOffIcon />}
            {camOn ? <CamOnIcon /> : <CamOffIcon />}
            {handRaised && <HandRaiseIcon />}
            {screenSharing && <ScreenShareOnIcon />}
          </div>
        </div>
        <button className="pp-row-chat" onClick={(e) => { e.stopPropagation(); onToggle(); }} title={`Chat with ${name}`}>
          <ChatIcon />
        </button>
        <button className="pp-row-more" onClick={(e) => { e.stopPropagation(); onToggle(); }} title="More options">
          <MoreVerticalIcon />
        </button>
      </div>

      {expanded && (
        <div className="pp-more-menu">
          {isHost ? (
            <>
              <button className="pp-more-item" onClick={() => doModerate("mute")}><MicOffIcon /> Mute</button>
              <button className="pp-more-item" onClick={() => doModerate("unmute")}><MicOnIcon /> Request Unmute</button>
              <button className="pp-more-item" onClick={() => doModerate("cameraOff")}><CamOffIcon /> Turn Off Camera</button>
              <button className="pp-more-item pp-more-item--danger" onClick={() => doModerate("kick")}>Remove from Room</button>
            </>
          ) : (
            <>
              <button className="pp-more-item" onClick={onToggle}><PinIcon /> Pin for Me</button>
              <button className="pp-more-item" onClick={onToggle}>💬 Send Message</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
