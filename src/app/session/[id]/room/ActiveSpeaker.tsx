"use client";

import { useEffect, useRef, useState } from "react";
import {
  useIsSpeaking,
  useParticipantAttributes,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import { PARTICIPANT_LANG_ATTR } from "@/lib/config";
import { getLanguageByCode } from "@/lib/languages";

/**
 * Large center tile showing the active speaker with an Orbit highlight border
 * and optional translation status overlay.
 */
export default function ActiveSpeaker({
  participant,
  myLang,
}: {
  participant: Participant | null;
  myLang: string;
}) {
  if (!participant) {
    return (
      <div className="active-speaker-wrap">
        <div className="active-speaker-empty-inner">
          <span className="active-speaker-placeholder-text">
            No active speaker
          </span>
        </div>
      </div>
    );
  }

  return <ActiveSpeakerInner participant={participant} myLang={myLang} />;
}

function ActiveSpeakerInner({
  participant,
  myLang,
}: {
  participant: Participant;
  myLang: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const isSpeaking = useIsSpeaking(participant);
  const { attributes } = useParticipantAttributes({ participant });

  const speakerLang = attributes?.[PARTICIPANT_LANG_ATTR];
  const langInfo = speakerLang ? getLanguageByCode(speakerLang) : undefined;
  const needsTranslation = !!speakerLang && speakerLang !== myLang;

  const displayName = participant.name || participant.identity;
  const initial = displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      let cam = false;
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.source === Track.Source.Camera && pub.track && !pub.isMuted) {
          pub.track.attach(video);
          cam = true;
        }
      }
      if (!cam) video.srcObject = null;
      setCameraOn(cam);
    };

    sync();
    participant.on("trackSubscribed", sync);
    participant.on("trackUnsubscribed", sync);
    participant.on("trackPublished", sync);
    participant.on("trackUnpublished", sync);
    participant.on("localTrackPublished", sync);
    participant.on("localTrackUnpublished", sync);
    participant.on("trackMuted", sync);
    participant.on("trackUnmuted", sync);
    return () => {
      participant.off("trackSubscribed", sync);
      participant.off("trackUnsubscribed", sync);
      participant.off("trackPublished", sync);
      participant.off("trackUnpublished", sync);
      participant.off("localTrackPublished", sync);
      participant.off("localTrackUnpublished", sync);
      participant.off("trackMuted", sync);
      participant.off("trackUnmuted", sync);
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.track) pub.track.detach(video);
      }
    };
  }, [participant]);

  return (
    <div className={`active-speaker-wrap${isSpeaking ? " active-speaker-speaking" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`active-speaker-video${cameraOn ? "" : " hidden"}`}
      />
      {!cameraOn && (
        <div className="active-speaker-placeholder">
          <span className="active-speaker-initial">{initial}</span>
        </div>
      )}

      {/* Bottom overlay: name + translation status */}
      <div className="active-speaker-overlay">
        <span className="active-speaker-name">{displayName}</span>
        {needsTranslation && isSpeaking && (
          <span className="active-speaker-status">
            Translating to {getLanguageByCode(myLang)?.name || myLang} &middot; Orus
          </span>
        )}
        {langInfo && !isSpeaking && (
          <span className="active-speaker-lang-badge">
            {langInfo.flag} {langInfo.name}
          </span>
        )}
      </div>
    </div>
  );
}
