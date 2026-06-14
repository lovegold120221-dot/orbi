"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useLocalParticipant,
  useRoomContext,
  useDataChannel,
} from "@livekit/components-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import type { PostgrestError } from "@supabase/supabase-js";

type ChatMessage = {
  id: string;
  from: string;
  fromId: string;
  message: string;
  timestamp: number;
};

const CHAT_TOPIC = "orbit_chat";

export default function ChatSidebar({
  onClose,
  privateTo,
}: {
  onClose: () => void;
  privateTo?: string;
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { profile } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef(new Set<string>());

  // Load chat history from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("meeting_id", room.name)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error("Failed to load chat history:", error);
        setLoaded(true);
        return;
      }

      const history: ChatMessage[] = (data || []).map((row: Record<string, unknown>) => {
        const msg: ChatMessage = {
          id: row.id as string,
          from: (row.sender_name as string) || (row.user_id as string) || "Unknown",
          fromId: (row.user_id as string) || "",
          message: row.message as string,
          timestamp: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
        };
        seenIds.current.add(msg.id);
        return msg;
      });

      setMessages(history);
      setLoaded(true);
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [room.name]);

  // Listen for incoming real-time chat messages
  useDataChannel(CHAT_TOPIC, useCallback((msg: { payload: Uint8Array }) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload)) as ChatMessage;
      // Deduplicate against DB-loaded messages
      if (!seenIds.current.has(payload.id)) {
        seenIds.current.add(payload.id);
        setMessages((prev) => [...prev, payload]);
      }
    } catch {}
  }, []));

  // Auto-scroll
  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !localParticipant) return;

    const senderName = localParticipant.name || localParticipant.identity || "Unknown";
    const senderId = profile?.id || localParticipant.identity || "unknown";

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: senderName,
      fromId: senderId,
      message: text.trim(),
      timestamp: Date.now(),
    };

    // 1. Broadcast via LiveKit data channel (all participants see it in real-time)
    const encoder = new TextEncoder();
    localParticipant.publishData(encoder.encode(JSON.stringify(msg)), {
      topic: CHAT_TOPIC,
      reliable: true,
    });

    // 2. Add to local state immediately
    seenIds.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
    setText("");

    // 3. Persist to Supabase (all public messages, including anonymous)
    setSaveError(null);
    supabase.from("chat_messages").insert({
      meeting_id: room.name,
      user_id: senderId,
      sender_name: senderName,
      message: msg.message,
    }).then(({ error }: { error: PostgrestError | null }) => {
      if (error) {
        console.error("Failed to save chat:", error);
        setSaveError("Chat not saved to server. Check Supabase migrations.");
      }
    });
  };

  const display = privateTo
    ? messages.filter((m) => m.fromId === privateTo || m.from === privateTo)
    : messages;

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>{privateTo ? `Chat to ${privateTo}` : "Chat"}</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div ref={bodyRef} className="sidebar-body chat-sidebar-body">
        {!loaded ? (
          <div className="chat-sidebar-empty">Loading messages...</div>
        ) : display.length === 0 ? (
          <div className="chat-sidebar-empty">No messages yet. Say hi!</div>
        ) : (
          display.map((msg) => (
            <div key={msg.id} className="chat-sidebar-msg-wrapper">
              <div className="chat-sidebar-msg-header">
                <strong>{msg.from}</strong>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="chat-sidebar-msg-content">{msg.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="chat-sidebar-footer">
        {saveError && (
          <div className="chat-sidebar-error">{saveError}</div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="chat-sidebar-form"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="chat-sidebar-input"
            autoFocus
          />
          <button type="submit" disabled={!text.trim()} className="chat-sidebar-btn">Send</button>
        </form>
      </div>
    </div>
  );
}
