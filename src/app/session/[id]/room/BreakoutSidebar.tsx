/* eslint-disable react/forbid-dom-props, react/forbid-component-props, react-native/no-inline-styles */
"use client";

import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useState } from "react";

export default function BreakoutSidebar({ onClose }: { onClose: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [loading, setLoading] = useState(false);
  const [activeBreakoutRooms, setActiveBreakoutRooms] = useState<string[]>([]);
  const [numRooms, setNumRooms] = useState(2);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleStartBreakout = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      // Exclude local participant (host stays in main room)
      const remoteParticipants = participants.filter(p => !p.isLocal);
      if (remoteParticipants.length === 0) {
        setStatusMsg("No other participants to assign to breakout rooms.");
        setLoading(false);
        return;
      }

      const assignments: { identity: string; newRoom: string; displayName: string }[] = [];
      
      remoteParticipants.forEach((p, index) => {
        const roomSuffix = (index % numRooms) + 1;
        assignments.push({
          identity: p.identity,
          displayName: p.name || p.identity,
          newRoom: `${room.name}-breakout-${roomSuffix}`,
        });
      });

      const res = await fetch("/api/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          originalRoom: room.name,
          assignments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Track which breakout rooms are active
      const rooms = [...new Set(assignments.map(a => a.newRoom))];
      setActiveBreakoutRooms(rooms);
      setStatusMsg(`Breakout rooms started! ${assignments.length} participants assigned to ${rooms.length} rooms.`);
    } catch (e: any) {
      setStatusMsg("Failed to start breakouts: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreakout = async () => {
    if (activeBreakoutRooms.length === 0) {
      // Default names if we lost state
      const defaultRooms = Array.from({ length: numRooms }, (_, i) => `${room.name}-breakout-${i + 1}`);
      setActiveBreakoutRooms(defaultRooms);
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stop",
          originalRoom: room.name,
          breakoutRooms: activeBreakoutRooms.length > 0 ? activeBreakoutRooms : Array.from({ length: numRooms }, (_, i) => `${room.name}-breakout-${i + 1}`),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveBreakoutRooms([]);
      setStatusMsg("Breakout rooms ended. Participants can rejoin the main room.");
    } catch (e: any) {
      setStatusMsg("Failed to end breakouts: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>Breakout Rooms</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div className="sidebar-body sidebar-body-breakout">
        <p className="breakout-desc">
          Divide participants into separate breakout rooms with their own audio/video and translation.
        </p>

        <div className="breakout-controls">
          <label className="breakout-label">
            Number of rooms:
            <select
              className="settings-select"
              value={numRooms}
              onChange={(e) => setNumRooms(Number(e.target.value))}
              disabled={loading || activeBreakoutRooms.length > 0}
            >
              <option value={2}>2 Rooms</option>
              <option value={3}>3 Rooms</option>
              <option value={4}>4 Rooms</option>
            </select>
          </label>
        </div>

        <button 
          onClick={handleStartBreakout}
          disabled={loading || activeBreakoutRooms.length > 0}
          className="btn btn-accent breakout-btn"
          data-loading={loading ? "true" : "false"}
        >
          {activeBreakoutRooms.length > 0 ? "Breakout Rooms Active" : "Start Breakout Rooms"}
        </button>

        <button 
          onClick={handleEndBreakout}
          disabled={loading || activeBreakoutRooms.length === 0}
          className="btn btn-dark breakout-btn"
          data-loading={loading ? "true" : "false"}
        >
          End Breakout Rooms
        </button>

        {statusMsg && (
          <p className="breakout-status">{statusMsg}</p>
        )}

        {activeBreakoutRooms.length > 0 && (
          <div className="breakout-room-list">
            <p className="breakout-room-list-title">Active Rooms:</p>
            {activeBreakoutRooms.map(r => (
              <div key={r} className="breakout-room-chip">{r}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
