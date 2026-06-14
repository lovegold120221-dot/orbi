import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient, AccessToken, RoomConfiguration, RoomAgentDispatch } from "livekit-server-sdk";

// Must match agent_name in agent.py
const TRANSLATOR_AGENT_NAME = "gemini-translator";

export async function POST(req: NextRequest) {
  try {
    const { action, originalRoom, assignments, breakoutRooms } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: "LiveKit credentials not configured" }, { status: 500 });
    }

    const roomService = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    if (action === "start") {
      if (!assignments || !originalRoom) {
        return NextResponse.json({ error: "Missing assignments or originalRoom" }, { status: 400 });
      }

      const createdRooms = new Set<string>();

      for (const assignment of assignments) {
        const { identity, displayName = identity, newRoom } = assignment;
        if (!identity || !newRoom) continue;

        // Create the breakout room if it hasn't been created yet
        if (!createdRooms.has(newRoom)) {
          try {
            await roomService.createRoom({
              name: newRoom,
              emptyTimeout: 300,
              maxParticipants: 8,
            });
            createdRooms.add(newRoom);
          } catch (e: any) {
            if (!e.message?.includes("already exists")) {
              console.warn(`Failed to create breakout room ${newRoom}:`, e);
            }
          }
        }

        // Generate a token for this participant to join the breakout room
        const at = new AccessToken(apiKey, apiSecret, {
          identity: `${identity}-breakout`,
          name: displayName,
          ttl: 4 * 60 * 60,
        });
        at.addGrant({
          roomJoin: true,
          room: newRoom,
          canPublish: true,
          canPublishData: true,
          canSubscribe: true,
          canUpdateOwnMetadata: true,
        });
        // Dispatch the translator agent to the breakout room too
        at.roomConfig = new RoomConfiguration({
          agents: [
            new RoomAgentDispatch({
              agentName: TRANSLATOR_AGENT_NAME,
              metadata: JSON.stringify({ sessionId: newRoom }),
            }),
          ],
          emptyTimeout: 300,
          maxParticipants: 8,
        });
        const token = await at.toJwt();

        // Send the join instruction + token to the participant via data message
        const payload = JSON.stringify({
          type: "BREAKOUT_JOIN",
          newRoom,
          originalRoom,
          token,
          serverUrl,
        });
        const data = new TextEncoder().encode(payload);
        await roomService.sendData(originalRoom, data, 1, {
          destinationIdentities: [identity],
          topic: "breakout",
        });
      }

      return NextResponse.json({ success: true, createdRooms: Array.from(createdRooms) });
    } else if (action === "stop") {
      if (!breakoutRooms || !Array.isArray(breakoutRooms)) {
        return NextResponse.json({ error: "Missing breakoutRooms array" }, { status: 400 });
      }

      // Notify all breakout rooms to end
      for (const bRoom of breakoutRooms) {
        try {
          const payload = JSON.stringify({ type: "BREAKOUT_END", originalRoom });
          const data = new TextEncoder().encode(payload);
          await roomService.sendData(bRoom, data, 1, { topic: "breakout" });
        } catch (e) {
          console.warn(`Failed to broadcast to breakout room ${bRoom}:`, e);
        }

        // Delete the breakout room
        try {
          await roomService.deleteRoom(bRoom);
        } catch (e) {
          console.warn(`Failed to delete breakout room ${bRoom}:`, e);
        }
      }

      return NextResponse.json({ success: true, endedRooms: breakoutRooms });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Breakout API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to process breakout request.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
