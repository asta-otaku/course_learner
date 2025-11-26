"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostTwilioAccessToken } from "@/lib/api/mutations";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

// Twilio Video types (will be available globally after script loads)
declare global {
  interface Window {
    Twilio: any;
  }
}

export default function VideoMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = params.roomName as string;

  const [twilioLoaded, setTwilioLoaded] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);

  const accessTokenMutation = usePostTwilioAccessToken();

  // Load Twilio Video SDK
  const handleTwilioScriptLoad = () => {
    console.log("Twilio Video SDK loaded");
    setTwilioLoaded(true);
  };

  // Join the room when Twilio is loaded
  useEffect(() => {
    if (twilioLoaded && !room && !isConnecting && roomName) {
      joinRoom();
    }
  }, [twilioLoaded, roomName]);

  // Join video room
  const joinRoom = async () => {
    if (!roomName) {
      setError("Room name is required");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get access token from backend
      const response = await accessTokenMutation.mutateAsync({
        roomName: roomName,
      });

      const token = response.data.data;
      console.log("Access token received:", token);

      // Connect to Twilio Video room
      const connectedRoom = await window.Twilio.Video.connect(token, {
        name: roomName,
        audio: true,
        video: { width: 640 },
      });

      console.log("Successfully joined room:", connectedRoom);
      setRoom(connectedRoom);

      // Handle local participant
      handleLocalParticipant(connectedRoom.localParticipant);

      // Handle existing remote participants
      connectedRoom.participants.forEach(handleRemoteParticipant);

      // Listen for new participants
      connectedRoom.on("participantConnected", handleRemoteParticipant);

      // Listen for participants leaving
      connectedRoom.on(
        "participantDisconnected",
        handleParticipantDisconnected
      );

      // Handle room disconnection
      connectedRoom.on("disconnected", () => {
        console.log("Disconnected from room");
        setRoom(null);
      });
    } catch (err: any) {
      console.error("Error joining room:", err);
      setError(err.message || "Failed to join room");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle local participant (your own video/audio)
  const handleLocalParticipant = (participant: any) => {
    console.log("Local participant:", participant.identity);

    const localDiv = document.createElement("div");
    localDiv.id = `participant-${participant.identity}`;
    localDiv.className =
      "relative rounded-lg overflow-hidden bg-gray-900 aspect-video";

    // Create name label
    const nameLabel = document.createElement("div");
    nameLabel.className =
      "absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium";
    nameLabel.textContent = `${participant.identity} (You)`;
    localDiv.appendChild(nameLabel);

    participant.tracks.forEach((publication: any) => {
      if (publication.track) {
        attachTrack(publication.track, localDiv);
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      attachTrack(track, localDiv);
    });

    if (localVideoRef.current) {
      localVideoRef.current.appendChild(localDiv);
    }
  };

  // Handle remote participants
  const handleRemoteParticipant = (participant: any) => {
    console.log("Remote participant connected:", participant.identity);

    const participantDiv = document.createElement("div");
    participantDiv.id = `participant-${participant.identity}`;
    participantDiv.className =
      "relative rounded-lg overflow-hidden bg-gray-900 aspect-video";

    // Create name label
    const nameLabel = document.createElement("div");
    nameLabel.className =
      "absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium";
    nameLabel.textContent = participant.identity;
    participantDiv.appendChild(nameLabel);

    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed && publication.track) {
        attachTrack(publication.track, participantDiv);
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      attachTrack(track, participantDiv);
    });

    participant.on("trackUnsubscribed", (track: any) => {
      detachTrack(track, participantDiv);
    });

    if (remoteVideosRef.current) {
      remoteVideosRef.current.appendChild(participantDiv);
    }
  };

  // Handle participant disconnection
  const handleParticipantDisconnected = (participant: any) => {
    console.log("Participant disconnected:", participant.identity);
    const participantDiv = document.getElementById(
      `participant-${participant.identity}`
    );
    if (participantDiv) {
      participantDiv.remove();
    }
  };

  // Attach track (video or audio) to DOM
  const attachTrack = (track: any, container: HTMLElement) => {
    const element = track.attach();
    element.className =
      track.kind === "video" ? "w-full h-full object-cover" : "";
    container.appendChild(element);
  };

  // Detach track from DOM
  const detachTrack = (track: any, container: HTMLElement) => {
    track.detach().forEach((element: HTMLElement) => {
      element.remove();
    });
  };

  // Toggle local audio
  const toggleAudio = () => {
    if (room && room.localParticipant) {
      room.localParticipant.audioTracks.forEach((publication: any) => {
        if (localAudioEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setLocalAudioEnabled(!localAudioEnabled);
    }
  };

  // Toggle local video
  const toggleVideo = () => {
    if (room && room.localParticipant) {
      room.localParticipant.videoTracks.forEach((publication: any) => {
        if (localVideoEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setLocalVideoEnabled(!localVideoEnabled);
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    router.push("/dashboard");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return (
    <>
      {/* Load Twilio Video SDK */}
      <Script
        src="https://sdk.twilio.com/js/video/releases/2.28.1/twilio-video.min.js"
        onLoad={handleTwilioScriptLoad}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Video Conference</h1>
              <p className="text-sm text-gray-400">Room: {roomName}</p>
            </div>
            {room && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
              <Button
                onClick={joinRoom}
                className="mt-3 bg-red-600 hover:bg-red-700"
                disabled={isConnecting}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {!twilioLoaded && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-400">Loading video SDK...</p>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-400">Connecting to room...</p>
              </div>
            </div>
          )}

          {/* Video Grid */}
          {twilioLoaded && !isConnecting && (
            <div className="space-y-6">
              {/* Remote Participants */}
              <div
                ref={remoteVideosRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              />

              {/* Local Participant */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div ref={localVideoRef} />
              </div>

              {/* No participants message */}
              {room && remoteVideosRef.current?.children.length === 0 && (
                <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                  <Video className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">Waiting for others to join...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        {room && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
              {/* Mute/Unmute Audio */}
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`rounded-full w-14 h-14 ${
                  localAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {localAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </Button>

              {/* Turn Video On/Off */}
              <Button
                onClick={toggleVideo}
                size="lg"
                className={`rounded-full w-14 h-14 ${
                  localVideoEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {localVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </Button>

              {/* Leave Room */}
              <Button
                onClick={leaveRoom}
                size="lg"
                className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
