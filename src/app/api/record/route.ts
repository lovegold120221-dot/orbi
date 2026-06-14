import { NextRequest, NextResponse } from "next/server";
import { EgressClient, EncodedFileOutput, EncodedFileType, AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const { action, roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: "Missing roomName parameter" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: "LiveKit credentials not configured" }, { status: 500 });
    }

    const egressClient = new EgressClient(serverUrl, apiKey, apiSecret);

    if (action === "start") {
      // Bypass EgressClient's output validation bug by hitting Twirp directly
      const at = new AccessToken(apiKey, apiSecret, { identity: "admin-bot", ttl: 60 });
      at.addGrant({ roomRecord: true });
      const jwt = await at.toJwt();
      
      let host = serverUrl.replace(/\/$/, "");
      host = host.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
      
      const res = await fetch(`${host}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({
          room_name: roomName,
          file: {
            filepath: `recording-${roomName}-${Date.now()}.mp4`,
            file_type: 1 // MP4
          },
          file_outputs: [{
            filepath: `recording-${roomName}-${Date.now()}.mp4`,
            file_type: 1
          }]
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.msg || `Failed to start egress (${res.status})`);
      }

      const egressData = await res.json();
      return NextResponse.json({ success: true, egressId: egressData.egress_id });
    } else if (action === "stop") {
      const list = await egressClient.listEgress({ roomName });
      let stoppedCount = 0;
      
      for (const e of list) {
        // Status 1 (STARTING) or 2 (ACTIVE) indicates an ongoing egress
        if (e.status === 1 || e.status === 2) {
          await egressClient.stopEgress(e.egressId);
          stoppedCount++;
        }
      }
      return NextResponse.json({ success: true, stoppedCount });
    } else {
      return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Recording API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process recording request. Ensure Egress is configured." },
      { status: 500 }
    );
  }
}
