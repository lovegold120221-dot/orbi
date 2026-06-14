/* eslint-disable react/forbid-dom-props, react/forbid-component-props, react-native/no-inline-styles */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type BackgroundOption = "none" | "blur" | `color-${string}` | `custom-${string}`;

const PRESET_COLORS = [
  { id: "color-#1a1a2e", label: "Deep navy", value: "#1a1a2e" },
  { id: "color-#16213e", label: "Dark blue", value: "#16213e" },
  { id: "color-#0f3460", label: "Royal blue", value: "#0f3460" },
  { id: "color-#2d6a4f", label: "Forest", value: "#2d6a4f" },
  { id: "color-#5c4033", label: "Warm brown", value: "#5c4033" },
  { id: "color-#3d3d3d", label: "Charcoal", value: "#3d3d3d" },
  { id: "color-#f0f0f0", label: "Soft white", value: "#f0f0f0" },
  { id: "color-#c3aed6", label: "Lavender", value: "#c3aed6" },
];

const STORAGE_BGS_KEY = "orbit.customBgs";

export default function CameraPreview({
  mirror,
  onMirrorChange,
  background,
  onBackgroundChange,
  onDirty,
}: {
  mirror: boolean;
  onMirrorChange: (v: boolean) => void;
  background: string;
  onBackgroundChange: (v: string) => void;
  onDirty: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [customBgs, setCustomBgs] = useState<{ name: string; data: string }[]>([]);

  // Load custom backgrounds from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BGS_KEY);
      if (raw) setCustomBgs(JSON.parse(raw));
    } catch { /* ignore corrupt data */ }
  }, []);

  // Start / stop camera
  const startCamera = useCallback(async () => {
    try {
      setCamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamOn(true);
    } catch (err: any) {
      setCamError(err?.message || "Camera access denied");
      setCamOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Find custom bg data URL if selected
  const selectedCustomData = background.startsWith("custom-")
    ? customBgs.find((b) => `custom-${b.name}` === background)?.data
    : null;

  // Compute the container style based on background choice
  const containerStyle: React.CSSProperties = (() => {
    if (background === "none") return {};
    if (background === "blur") return {};
    if (background.startsWith("color-")) {
      const hex = background.replace("color-", "");
      return { background: hex };
    }
    if (background.startsWith("custom-") && selectedCustomData) {
      return {
        backgroundImage: `url(${selectedCustomData})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {};
  })();

  const showBackgroundEffect = background !== "none";

  // Compute video transform — combine mirror and blur scale so they don't conflict
  const videoTransform =
    mirror && background === "blur"
      ? "scaleX(-1) scale(1.1)"
      : mirror
        ? "scaleX(-1)"
        : background === "blur"
          ? "scale(1.1)"
          : undefined;

  // Delete a custom background
  const deleteCustomBg = (name: string) => {
    const updated = customBgs.filter((b) => b.name !== name);
    setCustomBgs(updated);
    localStorage.setItem(STORAGE_BGS_KEY, JSON.stringify(updated));
    if (background === `custom-${name}`) {
      onBackgroundChange("none");
      onDirty();
    }
  };

  // Upload a custom background image
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const name = `bg-${Date.now()}`;
      const updated = [...customBgs, { name, data: dataUrl }];
      setCustomBgs(updated);
      localStorage.setItem(STORAGE_BGS_KEY, JSON.stringify(updated));
      onBackgroundChange(`custom-${name}`);
      onDirty();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="settings-preview-section">
      {/* Preview box */}
      <div className="settings-preview-header">Camera Preview</div>
      <div
        className={`settings-cam-preview${showBackgroundEffect ? " settings-cam-preview--bg" : ""}`}
        style={containerStyle}
      >
        {camOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="settings-cam-video"
            style={{
              transform: videoTransform,
              filter: background === "blur" ? "blur(12px)" : undefined,
            }}
          />
        ) : camError ? (
          <div className="settings-cam-error">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 10l5-2v8l-5-2v-4" />
              <rect x="3" y="6" width="13" height="12" rx="2" />
              <path d="M3 3l18 18" />
            </svg>
            <span>{camError}</span>
            <button onClick={startCamera} className="btn btn-outline" style={{ marginTop: 8, padding: '6px 16px', fontSize: 13 }}>
              Retry
            </button>
          </div>
        ) : (
          <div className="settings-cam-error">
            <div className="spinner" />
            <span>Starting camera...</span>
          </div>
        )}
      </div>

      {/* Mirror + Background row */}
      <div className="setting-row">
        <div className="setting-info">
          <h4>Mirror my video</h4>
        </div>
        <div className="setting-actions">
          <button
            className="btn btn-outline"
            onClick={() => setShowBgPicker(!showBgPicker)}
          >
            {showBgPicker ? "Hide" : "Background"}
          </button>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={mirror}
              onChange={(e) => { onMirrorChange(e.target.checked); onDirty(); }}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      {/* Background picker panel */}
      {showBgPicker && (
        <div className="settings-bg-picker">
          <div className="settings-bg-options">
            {/* None */}
            <button
              className={`settings-bg-opt${background === "none" ? " settings-bg-opt--active" : ""}`}
              onClick={() => { onBackgroundChange("none"); onDirty(); }}
            >
              <div className="settings-bg-thumb settings-bg-thumb--none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </div>
              <span>None</span>
            </button>

            {/* Blur */}
            <button
              className={`settings-bg-opt${background === "blur" ? " settings-bg-opt--active" : ""}`}
              onClick={() => { onBackgroundChange("blur"); onDirty(); }}
            >
              <div className="settings-bg-thumb settings-bg-thumb--blur">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 0 20" />
                </svg>
              </div>
              <span>Blur</span>
            </button>

            {/* Color presets */}
            {PRESET_COLORS.map((c) => (
              <button
                key={c.id}
                className={`settings-bg-opt${background === c.id ? " settings-bg-opt--active" : ""}`}
                onClick={() => { onBackgroundChange(c.id); onDirty(); }}
              >
                <div
                  className="settings-bg-thumb"
                  style={{ background: c.value, border: c.value === "#f0f0f0" ? "1px solid var(--border)" : "none" }}
                />
                <span>{c.label}</span>
              </button>
            ))}

            {/* Custom uploaded backgrounds */}
            {customBgs.map((bg) => (
              <button
                key={bg.name}
                className={`settings-bg-opt${background === `custom-${bg.name}` ? " settings-bg-opt--active" : ""}`}
                onClick={() => { onBackgroundChange(`custom-${bg.name}`); onDirty(); }}
              >
                <div className="settings-bg-thumb" style={{ position: "relative" }}>
                  <img src={bg.data} alt={bg.name} className="settings-bg-thumb-img" />
                  <button
                    className="settings-bg-delete"
                    onClick={(e) => { e.stopPropagation(); deleteCustomBg(bg.name); }}
                    title="Remove background"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <span>{bg.name.replace("bg-", "").slice(0, 8)}</span>
              </button>
            ))}

            {/* Upload new */}
            <button
              className="settings-bg-opt settings-bg-opt--upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="settings-bg-thumb settings-bg-thumb--upload">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
