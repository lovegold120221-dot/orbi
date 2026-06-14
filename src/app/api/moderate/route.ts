import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const { action, roomName, identity, trackSid } = await req.json();

    if (!action || !roomName || !identity) {
      return NextResponse.json(
        { error: "Missing required parameters (action, roomName, identity)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json(
        { error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    if (action === "kick") {
      await roomService.removeParticipant(roomName, identity);
      return NextResponse.json({ success: true, action: "kick" });
    } else if (action === "mute") {
      if (!trackSid) {
        return NextResponse.json(
          { error: "Missing trackSid for mute action" },
          { status: 400 }
        );
      }
      await roomService.mutePublishedTrack(roomName, identity, trackSid, true);
      return NextResponse.json({ success: true, action: "mute" });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Moderation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process moderation request" },
      { status: 500 }
    );
  }
}
