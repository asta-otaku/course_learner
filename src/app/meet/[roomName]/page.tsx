"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostTwilioAccessToken } from "@/lib/api/mutations";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2, Monitor, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

declare global {
  interface Window {
    Twilio: any;
  }
}

export default function VideoMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = params.roomName as string;

  const [userRole, setUserRole] = useState<"admin" | "tutor" | "user">("user");
  const [twilioLoaded, setTwilioLoaded] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const screenTrackRef = useRef<any>(null);

  const accessTokenMutation = usePostTwilioAccessToken();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const role = searchParams.get("role");
      if (role === "admin" || role === "tutor" || role === "user") {
        setUserRole(role);
      }
    }
  }, []);

  const handleTwilioScriptLoad = () => {
    console.log("✅ Twilio SDK loaded");
    setTwilioLoaded(true);
  };

  useEffect(() => {
    if (twilioLoaded && !room && !isConnecting && roomName) {
      console.log("🚀 Auto-joining room:", roomName);
      joinRoom();
    }
  }, [twilioLoaded, roomName]);

  const attachTracks = (tracks: any[], container: HTMLElement) => {
    tracks.forEach((track) => {
      if (track) {
        console.log("📎 Attaching track:", track.kind, track.name);
        container.appendChild(track.attach());
      }
    });
  };

  const detachTracks = (tracks: any[]) => {
    tracks.forEach((track) => {
      if (track) {
        track.detach().forEach((el: any) => el.remove());
      }
    });
  };

  const handleParticipantConnected = (participant: any) => {
    console.log("👤 Participant connected:", participant.identity);
    setParticipants((prev) => [...prev, participant.identity]);

    const participantDiv = document.createElement("div");
    participantDiv.id = participant.sid;
    participantDiv.className = "relative bg-gray-800 rounded-lg overflow-hidden aspect-video";

    const nameLabel = document.createElement("div");
    nameLabel.className = "absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10";
    nameLabel.textContent = participant.identity;
    participantDiv.appendChild(nameLabel);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.appendChild(participantDiv);
    }

    // Attach existing tracks
    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed) {
        attachTracks([publication.track], participantDiv);
      }
    });

    // Listen for new tracks
    participant.on("trackSubscribed", (track: any) => {
      console.log("📺 Track subscribed:", track.kind);
      attachTracks([track], participantDiv);
    });

    participant.on("trackUnsubscribed", (track: any) => {
      console.log("❌ Track unsubscribed:", track.kind);
      detachTracks([track]);
    });
  };

  const handleParticipantDisconnected = (participant: any) => {
    console.log("👋 Participant disconnected:", participant.identity);
    setParticipants((prev) => prev.filter((id) => id !== participant.identity));
    const participantDiv = document.getElementById(participant.sid);
    if (participantDiv) {
      participantDiv.remove();
    }
  };

  const joinRoom = async () => {
    if (!roomName) {
      setError("Room name is required");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log("🔑 Getting access token...");
      const response = await accessTokenMutation.mutateAsync({
        roomName: roomName,
      });

      const token = response.data.data;
      console.log("✅ Token received");

      console.log("🎥 Creating local video track...");
      const localTracks = await window.Twilio.Video.createLocalTracks({
        audio: true,
        video: { width: 640, height: 480 },
      });
      console.log("✅ Local tracks created:", localTracks.length);

      console.log("🔗 Connecting to room...");
      const connectedRoom = await window.Twilio.Video.connect(token, {
        name: roomName,
        tracks: localTracks,
      });

      console.log("✅ Connected to room:", connectedRoom.name);
      setRoom(connectedRoom);

      // Attach local video
      const localVideoTrack: any = Array.from(connectedRoom.localParticipant.videoTracks.values())[0];
      if (localVideoTrack && localVideoRef.current) {
        localVideoRef.current.appendChild(localVideoTrack.track.attach());
        console.log("✅ Local video attached");
      }

      // Handle existing participants
      connectedRoom.participants.forEach(handleParticipantConnected);

      // Handle new participants
      connectedRoom.on("participantConnected", handleParticipantConnected);
      connectedRoom.on("participantDisconnected", handleParticipantDisconnected);

      connectedRoom.on("disconnected", () => {
        console.log("❌ Disconnected from room");
        setRoom(null);
        setParticipants([]);
      });

    } catch (err: any) {
      console.error("❌ Error joining room:", err);
      setError(err.message || "Failed to join room");
    } finally {
      setIsConnecting(false);
    }
  };

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
      console.log("🎤 Audio:", !localAudioEnabled ? "ON" : "OFF");
    }
  };

  const toggleVideo = () => {
    if (room && room.localParticipant) {
      room.localParticipant.videoTracks.forEach((publication: any) => {
        if (!publication.trackName?.includes("screen")) {
          if (localVideoEnabled) {
            publication.track.disable();
          } else {
            publication.track.enable();
          }
        }
      });
      setLocalVideoEnabled(!localVideoEnabled);
      console.log("📹 Video:", !localVideoEnabled ? "ON" : "OFF");
    }
  };

  const shareScreen = async () => {
    if (!room) {
      setError("Please join the room first");
      return;
    }

    try {
      console.log("🖥️ Starting screen share...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = new window.Twilio.Video.LocalVideoTrack(
        stream.getTracks()[0],
        { name: "screen-share" }
      );

      await room.localParticipant.publishTrack(screenTrack);
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);
      console.log("✅ Screen sharing started");

      // Handle when user stops sharing via browser UI
      screenTrack.once("stopped", () => {
        console.log("🛑 Screen sharing stopped");
        stopScreenShare();
      });

    } catch (err: any) {
      console.error("❌ Screen share error:", err);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        setError("Failed to share screen. Please try again.");
      }
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current && room) {
      room.localParticipant.unpublishTrack(screenTrackRef.current);
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
      console.log("✅ Screen sharing stopped");
    }
  };

  const leaveRoom = () => {
    console.log("👋 Leaving room...");
    if (screenTrackRef.current) {
      stopScreenShare();
    }

    if (room) {
      room.disconnect();
      setRoom(null);
    }

    if (userRole === "admin") {
      router.push("/admin");
    } else if (userRole === "tutor") {
      router.push("/tutor");
    } else {
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    return () => {
      if (screenTrackRef.current) {
        stopScreenShare();
      }
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return (
    <>
      <Script
        src="https://sdk.twilio.com/js/video/releases/2.28.1/twilio-video.min.js"
        onLoad={handleTwilioScriptLoad}
        strategy="afterInteractive"
      />

      <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="w-full flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-semibold">
                Video Conference
              </h1>
              <div className="flex items-center gap-2 md:gap-3 mt-1 flex-wrap">
                <p className="text-xs md:text-sm text-gray-400 truncate">
                  Room: {roomName}
                </p>
                {userRole && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 capitalize flex-shrink-0">
                    {userRole}
                  </span>
                )}
              </div>
            </div>
            {room && (
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs md:text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">Connected</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-400 font-medium mb-2">
                    Connection Error
                  </h3>
                  <p className="text-red-300 text-sm mb-4">{error}</p>
                  <Button
                    onClick={joinRoom}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isConnecting}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!twilioLoaded && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-400">Loading video SDK...</p>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-400">Connecting to room...</p>
              </div>
            </div>
          )}

          {room && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    You {!localVideoEnabled && "(Video Off)"}
                  </div>
                  {!localVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Remote Videos Container */}
                <div ref={remoteVideoRef} className="grid gap-4">
                  {participants.length === 0 && (
                    <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-400 text-sm">Waiting for participants...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isScreenSharing && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center mb-4">
                  <p className="text-blue-400 text-sm">
                    🖥️ Screen sharing active
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {room && (
          <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4">
            <div className="max-w-md mx-auto flex items-center justify-center gap-3">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`rounded-full w-14 h-14 ${localAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
                title={localAudioEnabled ? "Mute" : "Unmute"}
              >
                {localAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </Button>

              <Button
                onClick={toggleVideo}
                size="lg"
                className={`rounded-full w-14 h-14 ${localVideoEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
                title={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {localVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </Button>

              <Button
                onClick={isScreenSharing ? stopScreenShare : shareScreen}
                size="lg"
                className={`rounded-full w-14 h-14 ${isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? (
                  <MonitorOff className="w-6 h-6" />
                ) : (
                  <Monitor className="w-6 h-6" />
                )}
              </Button>

              <Button
                onClick={leaveRoom}
                size="lg"
                className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
                title="Leave meeting"
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
