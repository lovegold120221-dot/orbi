
"use client";

import { useEffect, useRef, useState } from "react";
import {
  useIsSpeaking,
  useParticipantAttributes,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track, type RemoteParticipant } from "livekit-client";
import { NATIVE_LANG, PARTICIPANT_LANG_ATTR } from "@/lib/config";
import { getLanguageByCode } from "@/lib/languages";
import { MicOffIcon } from "./icons";

export default function ParticipantTile({
  participant,
  myLang,
  isHost,
  roomName,
}: {
  participant: RemoteParticipant;
  myLang: string;
  isHost?: boolean;
  roomName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { localParticipant } = useLocalParticipant();
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const isSpeaking = useIsSpeaking(participant);
  const { attributes } = useParticipantAttributes({ participant });
  const speakerLang = attributes?.[PARTICIPANT_LANG_ATTR];
  const langInfo = speakerLang ? getLanguageByCode(speakerLang) : undefined;

  const handleModerate = async (action: 'kick' | 'mute') => {
    if (!roomName) return;
    try {
      const payload: Record<string, string> = { action, roomName, identity: participant.identity };
      if (action === 'mute') {
        const audioPub = Array.from(participant.audioTrackPublications.values()).find(p => p.source === Track.Source.Microphone);
        if (!audioPub || !audioPub.trackSid) {
          alert('No active microphone found to mute.');
          return;
        }
        payload.trackSid = audioPub.trackSid;
      }
      const res = await fetch('/api/moderate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Action failed');
    } catch (e) {
      console.error(e);
      alert('Failed to execute moderation action.');
    }
  };

  const handleRequestVideo = async () => {
    if (!localParticipant) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: "REQUEST_VIDEO",
      targetIdentity: participant.identity
    }));
    await localParticipant.publishData(data, { topic: "moderate" });
  };

  // True iff we should be hearing their voice via the agent's translator
  // track right now — i.e., we want translation AND their lang differs.
  const needsTranslation =
    myLang !== NATIVE_LANG && !!speakerLang && speakerLang !== myLang;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      let cam = false;
      let mic = false;
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.source === Track.Source.Camera && pub.track && !pub.isMuted) {
          pub.track.attach(video);
          cam = true;
        }
      }
      for (const pub of participant.audioTrackPublications.values()) {
        if (pub.source === Track.Source.Microphone && !pub.isMuted) {
          mic = true;
        }
      }
      if (!cam) video.srcObject = null;
      setCameraOn(cam);
      setMicOn(mic);
    };

    sync();
    participant.on("trackSubscribed", sync);
    participant.on("trackUnsubscribed", sync);
    participant.on("trackPublished", sync);
    participant.on("trackUnpublished", sync);
    participant.on("trackMuted", sync);
    participant.on("trackUnmuted", sync);
    return () => {
      participant.off("trackSubscribed", sync);
      participant.off("trackUnsubscribed", sync);
      participant.off("trackPublished", sync);
      participant.off("trackUnpublished", sync);
      participant.off("trackMuted", sync);
      participant.off("trackUnmuted", sync);
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.track) pub.track.detach(video);
      }
    };
  }, [participant]);

  const displayName = participant.name || participant.identity;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className={`tile${isSpeaking && micOn ? " tile-speaking" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`tile-video ${cameraOn ? "" : "tile-video-hidden"}`}
      />
      {!cameraOn && (
        <div className="tile-placeholder">
          <span className="tile-placeholder-initial">{initial}</span>
        </div>
      )}

      {!micOn && (
        <div className="tile-mic-off" title="Microphone off">
          <MicOffIcon />
        </div>
      )}

      <div className="tile-name tile-name-wrapper">
        <div className="tile-name-row">
          <span className="tile-name-text">{displayName}</span>
          {langInfo && (
            <span className="tile-badge" title={langInfo.name}>
              <span aria-hidden>{langInfo.flag}</span>
              {needsTranslation ? `→ ${myLang.toUpperCase()}` : langInfo.code.toUpperCase()}
            </span>
          )}
        </div>
        {isHost && (
          <div className="tile-mod-btns">
            <button 
              onClick={() => handleRequestVideo()} 
              className="tile-mod-btn"
              title="Request camera on"
            >
              📷
            </button>
            <button 
              onClick={() => handleModerate('mute')} 
              className="tile-mod-btn tile-mod-btn-warning"
              title="Mute microphone"
            >
              🔇
            </button>
            <button 
              onClick={() => handleModerate('kick')} 
              className="tile-mod-btn tile-mod-btn-error"
              title="Remove from meeting"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
