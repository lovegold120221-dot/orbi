"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useLocalParticipant,
  useRoomContext,
  useTrackVolume,
} from "@livekit/components-react";
import { Track, LocalAudioTrack } from "livekit-client";
import { SpeakerIcon, SpeakerOffIcon } from "./icons";
import {
  CamOffIcon,
  CamOnIcon,
  CaptionsIcon,
  MicOffIcon,
  MicOnIcon,
  ParticipantsIcon,
  ChatIcon,
  ShareScreenIcon,
  TranslateIcon,
  RecordIcon,
  MoreIcon,
  BreakoutRoomsIcon,
  SettingsIcon,
  LinkIcon,
  CaretUpIcon,
  HandRaiseIcon,
} from "./icons";

export default function ControlBar({
  onLeave,
  activeSidebar,
  onToggleSidebar,
  speakerMuted,
  onToggleSpeaker,
  handRaised,
  onToggleHand,
}: {
  onLeave: () => void;
  activeSidebar: "participants" | "captions" | "translation" | "chat" | "breakout" | null;
  onToggleSidebar: (sidebar: "participants" | "captions" | "translation" | "chat" | "breakout") => void;
  speakerMuted: boolean;
  onToggleSpeaker: () => void;
  handRaised: boolean;
  onToggleHand: () => void;
}) {
  const { localParticipant, microphoneTrack, cameraTrack } = useLocalParticipant();
  const room = useRoomContext();
  const router = useRouter();
  const [isLocalRecording, setIsLocalRecording] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareWithAudio, setShareWithAudio] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const REACTIONS = ["✋", "👍", "👏", "😂", "❤️", "🎉", "🙌", "💯"];

  const sendReaction = (emoji: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      emoji,
      from: localParticipant.name || localParticipant.identity,
      fromId: localParticipant.identity,
    }));
    localParticipant.publishData(data, { topic: "react", reliable: true });
    onToggleHand();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const micOn = !!microphoneTrack && !microphoneTrack.isMuted;
  const camOn =
    !!cameraTrack &&
    cameraTrack.source === Track.Source.Camera &&
    !cameraTrack.isMuted;
  const screenShareOn = localParticipant.isScreenShareEnabled;

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!micOn);
  }
  async function toggleCam() {
    await localParticipant.setCameraEnabled(!camOn);
  }
  async function handleShareScreen() {
    if (screenShareOn) {
      // Stop sharing immediately
      await localParticipant.setScreenShareEnabled(false);
      return;
    }

    // Show dialog to choose options
    setShowShareDialog(true);
  }

  async function confirmShareScreen() {
    setShowShareDialog(false);
    try {
      await localParticipant.setScreenShareEnabled(true, {
        audio: shareWithAudio,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Failed to start screen share: " + msg);
    }
  }
  async function toggleRecording() {
    if (isLocalRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsLocalRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true,
        // @ts-expect-error - preferCurrentTab is a relatively new API flag not in all TS definitions
        preferCurrentTab: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let recordedBlob: Blob | null = null;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        recordedBlob = new Blob(chunks, { type: "video/webm" });
        const filename = `orbit-recording-${room.name}-${Date.now()}.webm`;

        // Try File System Access API: showSaveFilePicker lets user pick save location
        try {
          // @ts-expect-error - File System Access API types from WICG spec
          const fileHandle = await window.showSaveFilePicker?.({
            suggestedName: filename,
            types: [{ description: 'WebM Video', accept: { 'video/webm': ['.webm'] } }],
          });
          if (fileHandle) {
            const writable = await (fileHandle as unknown as { createWritable: () => Promise<FileSystemWritableFileStream> }).createWritable();
            await writable.write(recordedBlob);
            await writable.close();
            stream.getTracks().forEach((t) => t.stop());
            setIsLocalRecording(false);
            return;
          }
        } catch (_saveErr: unknown) {
          if ((_saveErr as Error)?.name !== 'AbortError') {
            console.warn("showSaveFilePicker failed, falling back to download:", _saveErr);
          }
        }

        // Fallback: download via <a> tag
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        stream.getTracks().forEach((t) => t.stop());
        setIsLocalRecording(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsLocalRecording(true);

      // Stop recording if the user closes the screen share via the browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Failed to start screen recording: " + msg);
      setIsLocalRecording(false);
    }
  }
  function toggleBreakout() {
    onToggleSidebar("breakout");
  }
  async function leave() {
    await room.disconnect();
    onLeave();
  }

  return (
    <div className="control-bar">
      {/* ——— Left: Audio / Video ——— */}
      <div className="control-bar-left">
        <MicButton
          micOn={micOn}
          toggleMic={toggleMic}
          microphoneTrack={microphoneTrack?.track as LocalAudioTrack | undefined}
        />
        <CtrlButton
          active={camOn}
          onClick={toggleCam}
          label="Video"
          icon={camOn ? <CamOnIcon /> : <CamOffIcon />}
          dataMobile="primary"
          hasCaret
        />
      </div>

      {/* ——— Center: Features ——— */}
      <div className="control-bar-center">
        <CtrlButton
          active={activeSidebar === "participants"}
          onClick={() => onToggleSidebar("participants")}
          label="People"
          icon={<ParticipantsIcon />}
          dataMobile="overflow"
          hasCaret
        />
        {/* Mobile "People" alias */}
        <CtrlButton
          active={activeSidebar === "participants"}
          onClick={() => onToggleSidebar("participants")}
          label="People"
          icon={<ParticipantsIcon />}
          dataMobile="primary-people"
        />
        <CtrlButton
          active={activeSidebar === "chat"}
          onClick={() => onToggleSidebar("chat")}
          label="Chat"
          icon={<ChatIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={screenShareOn}
          onClick={handleShareScreen}
          label="Share"
          icon={<ShareScreenIcon />}
          dataMobile="primary-share"
          hasCaret
          className="ctrl-share"
        />
        <CtrlButton
          active={activeSidebar === "translation"}
          onClick={() => onToggleSidebar("translation")}
          label="Translate"
          icon={<TranslateIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={isLocalRecording}
          onClick={toggleRecording}
          label="Record"
          icon={<RecordIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={activeSidebar === "breakout"}
          onClick={toggleBreakout}
          label="Breakout"
          icon={<BreakoutRoomsIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={speakerMuted}
          onClick={onToggleSpeaker}
          label="Speaker"
          icon={speakerMuted ? <SpeakerOffIcon /> : <SpeakerIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={showReactions || handRaised}
          onClick={() => setShowReactions((v) => !v)}
          label="React"
          icon={<HandRaiseIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={copied}
          onClick={handleCopyLink}
          label={copied ? "Copied" : "Link"}
          icon={<LinkIcon />}
          dataMobile="overflow"
        />
        <CtrlButton
          active={false}
          onClick={() => router.push("/settings")}
          label="Settings"
          icon={<SettingsIcon />}
          dataMobile="overflow"
        />
      </div>

      {/* ——— Right: Leave & More ——— */}
      <div className="control-bar-right">
        <button
          className="ctrl ctrl--warning ctrl-leave ctrl-desktop-leave"
          onClick={leave}
          title="Leave the call"
          aria-label="Leave"
        >
          Leave
        </button>
        {/* Mobile only */}
        <CtrlButton
          active={showMoreMenu}
          onClick={() => setShowMoreMenu(true)}
          label="More"
          icon={<MoreIcon />}
          dataMobile="more"
        />
      </div>

      {/* ——— Mobile "More" Menu ——— */}
      {showMoreMenu && (
        <div className="mobile-more-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="mobile-more-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-header">
              <h3>More Options</h3>
              <button className="mobile-more-close" onClick={() => setShowMoreMenu(false)} title="Close menu" aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="mobile-more-content">
              <button className="mobile-more-item" onClick={() => { onToggleSidebar("chat"); setShowMoreMenu(false); }}>
                <ChatIcon /> <span>Chat</span>
              </button>
              <button className="mobile-more-item" onClick={() => { onToggleSidebar("translation"); setShowMoreMenu(false); }}>
                <TranslateIcon /> <span>Translate</span>
              </button>
              <button className="mobile-more-item" onClick={() => { onToggleSidebar("captions"); setShowMoreMenu(false); }}>
                <CaptionsIcon /> <span>Captions</span>
              </button>
              <button className="mobile-more-item" onClick={() => { toggleRecording(); setShowMoreMenu(false); }}>
                <RecordIcon /> <span>{isLocalRecording ? "Stop Recording" : "Record"}</span>
              </button>
              <button className="mobile-more-item" onClick={() => { toggleBreakout(); setShowMoreMenu(false); }}>
                <BreakoutRoomsIcon /> <span>Breakout</span>
              </button>
              <button className="mobile-more-item" onClick={() => { onToggleSpeaker(); setShowMoreMenu(false); }}>
                {speakerMuted ? <SpeakerOffIcon /> : <SpeakerIcon />} <span>Speaker</span>
              </button>
              <button className="mobile-more-item" onClick={() => { handleCopyLink(); setShowMoreMenu(false); }}>
                <LinkIcon /> <span>{copied ? "Copied" : "Link"}</span>
              </button>
              <button className="mobile-more-item" onClick={() => { router.push("/settings"); setShowMoreMenu(false); }}>
                <SettingsIcon /> <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div className="reaction-picker">
          {REACTIONS.map((r) => (
            <button key={r} className="reaction-btn" onClick={() => { sendReaction(r); setShowReactions(false); }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* ——— Share Screen Dialog ——— */}
      {showShareDialog && (
        <div className="share-dialog-overlay" onClick={() => setShowShareDialog(false)}>
          <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="share-dialog-title">Share Screen</h3>
            <p className="share-dialog-desc">Choose what to share</p>
            <label className="share-dialog-option">
              <input
                type="checkbox"
                checked={shareWithAudio}
                onChange={(e) => setShareWithAudio(e.target.checked)}
              />
              <span className="share-dialog-option-icon">
                <SpeakerIcon />
              </span>
              <span className="share-dialog-option-text">
                <strong>Share computer sound</strong>
                <small>Also transmit system audio</small>
              </span>
            </label>
            <div className="share-dialog-actions">
              <button
                className="share-dialog-btn share-dialog-btn-cancel"
                onClick={() => setShowShareDialog(false)}
              >
                Cancel
              </button>
              <button
                className="share-dialog-btn share-dialog-btn-confirm"
                onClick={confirmShareScreen}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MicButton({
  micOn,
  toggleMic,
  microphoneTrack,
}: {
  micOn: boolean;
  toggleMic: () => void;
  microphoneTrack?: LocalAudioTrack;
}) {
  const volume = useTrackVolume(microphoneTrack);
  const isSpeaking = micOn && volume > 0.05;
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--volume-opacity', isSpeaking ? String(Math.min(0.8, volume * 2)) : '0');
      wrapperRef.current.style.setProperty('--volume-scale', isSpeaking ? String(1 + (volume * 0.5)) : '1');
    }
  }, [isSpeaking, volume]);

  return (
    <div ref={wrapperRef} className="mic-btn-wrapper">
      <CtrlButton
        active={micOn}
        onClick={toggleMic}
        label={micOn ? "Mute" : "Unmute"}
        icon={micOn ? <MicOnIcon /> : <MicOffIcon />}
        dataMobile="primary"
        muted={!micOn}
        hasCaret
        className="mic-btn"
      />
    </div>
  );
}

function CtrlButton({
  active,
  onClick,
  label,
  icon,
  dataMobile,
  hasCaret,
  muted,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  dataMobile?: string;
  hasCaret?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`ctrl${active ? " ctrl--active" : ""}${muted ? " ctrl--muted" : ""} ${className}`.trim()}
      onClick={onClick}
      title={label}
      aria-label={label}
      data-mobile={dataMobile}
    >
      <span className="ctrl-icon-row">
        <span className="ctrl-icon">{icon}</span>
        {hasCaret && <span className="ctrl-caret"><CaretUpIcon /></span>}
      </span>
      <span className="ctrl-label">{label}</span>
    </button>
  );
}
