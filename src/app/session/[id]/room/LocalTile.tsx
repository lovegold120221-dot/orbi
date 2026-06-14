"use client";

import { useEffect, useRef, useState } from "react";
import { useIsSpeaking, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { MicOffIcon } from "./icons";

export default function LocalTile({ myLang }: { myLang: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { localParticipant } = useLocalParticipant();
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  
  const isSpeaking = useIsSpeaking(localParticipant);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      let cam = false;
      let mic = false;
      for (const pub of localParticipant.videoTrackPublications.values()) {
        if (pub.source === Track.Source.Camera && pub.track && !pub.isMuted) {
          pub.track.attach(video);
          cam = true;
        }
      }
      for (const pub of localParticipant.audioTrackPublications.values()) {
        if (pub.source === Track.Source.Microphone && !pub.isMuted) {
          mic = true;
        }
      }
      if (!cam) video.srcObject = null;
      setCameraOn(cam);
      setMicOn(mic);
    };

    sync();
    localParticipant.on("localTrackPublished", sync);
    localParticipant.on("localTrackUnpublished", sync);
    localParticipant.on("trackMuted", sync);
    localParticipant.on("trackUnmuted", sync);
    return () => {
      localParticipant.off("localTrackPublished", sync);
      localParticipant.off("localTrackUnpublished", sync);
      localParticipant.off("trackMuted", sync);
      localParticipant.off("trackUnmuted", sync);
      for (const pub of localParticipant.videoTrackPublications.values()) {
        if (pub.track) pub.track.detach(video);
      }
    };
  }, [localParticipant]);

  const displayName = localParticipant.name || localParticipant.identity || "You";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className={`tile${isSpeaking && micOn ? " tile-speaking" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`tile-video local-tile-video-mirror ${cameraOn ? "" : "tile-video-hidden"}`}
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
          <span className="tile-name-text">{displayName} (You)</span>
        </div>
      </div>
    </div>
  );
}
