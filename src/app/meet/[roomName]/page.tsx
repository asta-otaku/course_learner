"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostTwilioAccessToken } from "@/lib/api/mutations";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2 } from "lucide-react";
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
  const [isSecureContext, setIsSecureContext] = useState(true);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  const accessTokenMutation = usePostTwilioAccessToken();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const role = searchParams.get("role");
      if (role === "admin" || role === "tutor" || role === "user") {
        setUserRole(role);
      }

      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost";
      setIsSecureContext(isSecure);
    }
  }, []);

  const handleTwilioScriptLoad = () => {
    setTwilioLoaded(true);
  };

  useEffect(() => {
    if (twilioLoaded && !room && !isConnecting && roomName) {
      joinRoom();
    }
  }, [twilioLoaded, roomName]);

  // EXACT PATTERN FROM TWILIO DOCS (with local/remote distinction)
  const handleConnectedParticipant = (participant: any, isLocal = false) => {
    // Create a div for this participant's tracks
    const participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.identity);
    participantDiv.setAttribute(
      "data-participant-type",
      isLocal ? "local" : "remote"
    );

    if (isLocal) {
      participantDiv.className =
        "absolute bottom-24 md:bottom-28 right-4 w-48 md:w-64 rounded-lg overflow-hidden bg-gray-900 aspect-video shadow-2xl border-2 border-gray-700 z-10";
    } else {
      participantDiv.className =
        "w-full h-full rounded-lg overflow-hidden bg-gray-900 aspect-video";
    }

    if (videoContainerRef.current) {
      videoContainerRef.current.appendChild(participantDiv);
    } else {
      console.error(`❌ videoContainerRef.current is null!`);
      return; // Exit early if container not ready
    }

    // Define handleTrackPublication inside so it can access participantDiv via closure
    const handleTrackPublication = (trackPublication: any) => {
      function displayTrack(track: any) {
        const attachedElement = track.attach();

        // Style video elements
        if (track.kind === "video") {
          attachedElement.className = "w-full h-full object-cover rounded-lg";
        }

        participantDiv.appendChild(attachedElement);
      }

      if (trackPublication.track) {
        displayTrack(trackPublication.track);
      }

      // Listen for any new subscriptions to this track publication
      trackPublication.on("subscribed", displayTrack);
    };

    // Iterate through the participant's published tracks and
    // call `handleTrackPublication` on them
    participant.tracks.forEach(handleTrackPublication);

    // Listen for any new track publications
    participant.on("trackPublished", handleTrackPublication);
  };

  // EXACT PATTERN FROM TWILIO DOCS
  const handleDisconnectedParticipant = (participant: any) => {
    // Remove this participant's div from the page
    const participantDiv = document.getElementById(participant.identity);
    if (participantDiv) {
      participantDiv.remove();
    }
  };

  const joinRoom = async () => {
    if (!roomName) {
      setError("Room name is required");
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setError(
        "Video calls require a secure connection (HTTPS). Please use HTTPS to access this page."
      );
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Clear container
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = "";
      }

      const response = await accessTokenMutation.mutateAsync({
        roomName: roomName,
      });

      const token = response.data.data;

      // Join the video room with the Access Token and the given room name
      const connectedRoom = await window.Twilio.Video.connect(token, {
        room: roomName,
      });

      setRoom(connectedRoom);

      // Render the local and remote participants' video and audio tracks
      handleConnectedParticipant(connectedRoom.localParticipant, true); // true = local participant
      connectedRoom.participants.forEach(
        (participant: any) => handleConnectedParticipant(participant, false) // false = remote participant
      );
      connectedRoom.on(
        "participantConnected",
        (participant: any) => handleConnectedParticipant(participant, false) // New remote participants
      );

      // Listen for participants leaving
      connectedRoom.on(
        "participantDisconnected",
        handleDisconnectedParticipant
      );

      // Handle room disconnection
      connectedRoom.on("disconnected", (room: any, error: any) => {
        if (error) {
          setError(`Disconnected: ${error.message}`);
        }
        setRoom(null);

        // Clear video container
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = "";
        }
      });

      // Handle page unload
      window.addEventListener("pagehide", () => connectedRoom.disconnect());
      window.addEventListener("beforeunload", () => connectedRoom.disconnect());
    } catch (err: any) {
      console.error("Error joining room:", err);
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
    }
  };

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

  const leaveRoom = () => {
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

      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between">
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
                  <span className="sm:hidden">●</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-28 flex-1">
          {/* HTTPS Warning */}
          {!isSecureContext && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-400 text-xl">🔒</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-yellow-400 font-medium mb-2">
                    Secure Connection Required
                  </h3>
                  <p className="text-yellow-300 text-sm mb-2">
                    Video calls require a secure HTTPS connection, especially on
                    mobile devices.
                  </p>
                  <p className="text-yellow-300 text-sm">
                    Please access this page using <strong>https://</strong>{" "}
                    instead of http://
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-6">
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

          {/* Loading States */}
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

          {/* Video Container - ALWAYS RENDERED so ref is never null */}
          <div className="w-full">
            {/* Relative container for PIP layout: remote video fills space, local video in corner */}
            <div
              ref={videoContainerRef}
              className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
            />

            {/* No participants message */}
            {room && videoContainerRef.current?.children.length === 0 && (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">
                  Waiting for others to join...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Share the meeting link with participants
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        {room && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 md:px-6 py-4 md:py-5 z-50">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-3 md:gap-4">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${
                  localAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={localAudioEnabled ? "Mute" : "Unmute"}
              >
                {localAudioEnabled ? (
                  <Mic className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <MicOff className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>

              <Button
                onClick={toggleVideo}
                size="lg"
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${
                  localVideoEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {localVideoEnabled ? (
                  <Video className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <VideoOff className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>

              <Button
                onClick={leaveRoom}
                size="lg"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 bg-red-600 hover:bg-red-700"
                title="Leave meeting"
              >
                <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
