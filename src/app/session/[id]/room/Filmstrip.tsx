"use client";

import type { RemoteParticipant } from "livekit-client";
import ParticipantTile from "./ParticipantTile";

export default function Filmstrip({
  participants,
  myLang,
}: {
  participants: RemoteParticipant[];
  myLang: string;
}) {
  if (participants.length === 0) return null;

  return (
    <div className="filmstrip">
      {participants.map((p) => (
        <ParticipantTile key={p.identity} participant={p} myLang={myLang} />
      ))}
    </div>
  );
}
