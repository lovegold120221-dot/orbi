/* eslint-disable react/forbid-dom-props, react/forbid-component-props, react-native/no-inline-styles */
"use client";

import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

export default function SelfView() {
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const track = cameraTrack?.track;
  const cameraOn =
    !!track &&
    cameraTrack?.source === Track.Source.Camera &&
    !cameraTrack.isMuted;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (cameraOn && track) {
      track.attach(video);
      return () => {
        track.detach(video);
      };
    }
    video.srcObject = null;
  }, [cameraOn, track]);

  const displayName = localParticipant?.name || "you";

  return (
    <div className="self-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="self-view-video"
        style={{ display: cameraOn ? "block" : "none" }}
      />
      {!cameraOn && (
        <div className="self-view-empty">
          <span>{displayName}</span>
        </div>
      )}
    </div>
  );
}
