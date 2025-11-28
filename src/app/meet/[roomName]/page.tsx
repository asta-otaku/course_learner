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

interface ParticipantState {
  element: HTMLDivElement;
  videoTrack?: any;
  audioTrack?: any;
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

  const videoGridRef = useRef<HTMLDivElement>(null);

  // Track all participants in state
  const [participants, setParticipants] = useState<
    Map<string, ParticipantState>
  >(new Map());

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

  // Create participant element
  const createParticipantElement = (
    participantId: string,
    isLocal: boolean = false
  ) => {
    const participantDiv = document.createElement("div");
    participantDiv.id = `participant-${participantId}`;
    participantDiv.className =
      "relative rounded-lg overflow-hidden bg-gray-900 aspect-video min-h-[250px]";

    // Video container
    const videoContainer = document.createElement("div");
    videoContainer.className = "w-full h-full";
    videoContainer.id = `video-container-${participantId}`;
    participantDiv.appendChild(videoContainer);

    // Name label
    const nameLabel = document.createElement("div");
    nameLabel.className =
      "absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium z-10";
    nameLabel.textContent = isLocal ? `${participantId} (You)` : participantId;
    participantDiv.appendChild(nameLabel);

    // Audio indicator (will show when audio is active)
    const audioIndicator = document.createElement("div");
    audioIndicator.className =
      "absolute top-3 right-3 bg-green-500 w-3 h-3 rounded-full hidden";
    audioIndicator.id = `audio-indicator-${participantId}`;
    participantDiv.appendChild(audioIndicator);

    return participantDiv;
  };

  // Attach track to participant element
  const attachTrack = (track: any, participantId: string) => {
    const participantState = participants.get(participantId);
    if (!participantState) return;

    const container = participantState.element.querySelector(
      `#video-container-${participantId}`
    );
    if (!container) return;

    // Remove existing track of same kind
    const existingTrack = container.querySelector(
      `[data-track-kind="${track.kind}"]`
    );
    if (existingTrack) {
      existingTrack.remove();
    }

    try {
      const element = track.attach();
      element.setAttribute("data-track-kind", track.kind);
      element.setAttribute("data-track-id", track.sid || track.id);

      if (track.kind === "video") {
        element.className = "w-full h-full object-cover";
        // Update participant state with video track
        setParticipants((prev) => {
          const newState = new Map(prev);
          const current = newState.get(participantId);
          if (current) {
            newState.set(participantId, { ...current, videoTrack: track });
          }
          return newState;
        });
      } else {
        element.className = "hidden"; // Hide audio elements
        // Update participant state with audio track
        setParticipants((prev) => {
          const newState = new Map(prev);
          const current = newState.get(participantId);
          if (current) {
            newState.set(participantId, { ...current, audioTrack: track });
          }
          return newState;
        });
      }

      container.appendChild(element);
      console.log(`Track attached: ${track.kind} for ${participantId}`);
    } catch (error) {
      console.error("Error attaching track:", error, track.kind, participantId);
    }
  };

  // Detach track from participant element
  const detachTrack = (track: any, participantId: string) => {
    const participantState = participants.get(participantId);
    if (!participantState) return;

    const container = participantState.element.querySelector(
      `#video-container-${participantId}`
    );
    if (!container) return;

    const trackElement = container.querySelector(
      `[data-track-id="${track.sid || track.id}"]`
    );
    if (trackElement) {
      trackElement.remove();
    }

    // Update participant state
    setParticipants((prev) => {
      const newState = new Map(prev);
      const current = newState.get(participantId);
      if (current) {
        if (track.kind === "video") {
          newState.set(participantId, { ...current, videoTrack: undefined });
        } else {
          newState.set(participantId, { ...current, audioTrack: undefined });
        }
      }
      return newState;
    });
  };

  // Add participant to the grid
  const addParticipant = (participant: any, isLocal: boolean = false) => {
    const participantId = participant.identity;

    if (participants.has(participantId)) {
      console.log("Participant already exists:", participantId);
      return;
    }

    console.log(
      "Adding participant:",
      participantId,
      isLocal ? "(local)" : "(remote)"
    );

    const participantElement = createParticipantElement(participantId, isLocal);

    // Add to participants state
    setParticipants((prev) => {
      const newState = new Map(prev);
      newState.set(participantId, { element: participantElement });
      return newState;
    });

    // Add to DOM
    if (videoGridRef.current) {
      videoGridRef.current.appendChild(participantElement);
    }

    // Handle existing tracks
    participant.tracks.forEach((publication: any) => {
      if (publication.track) {
        attachTrack(publication.track, participantId);
      }
    });

    // Listen for track subscriptions (remote) or publications (local)
    if (isLocal) {
      participant.on("trackPublished", (publication: any) => {
        if (publication.track) {
          attachTrack(publication.track, participantId);
        }
      });
    } else {
      participant.on("trackSubscribed", (track: any) => {
        console.log("Track subscribed:", track.kind, participantId);
        attachTrack(track, participantId);
      });

      participant.on("trackUnsubscribed", (track: any) => {
        console.log("Track unsubscribed:", track.kind, participantId);
        detachTrack(track, participantId);
      });
    }
  };

  // Remove participant from grid
  const removeParticipant = (participantId: string) => {
    console.log("Removing participant:", participantId);

    const participantState = participants.get(participantId);
    if (participantState) {
      participantState.element.remove();
    }

    setParticipants((prev) => {
      const newState = new Map(prev);
      newState.delete(participantId);
      return newState;
    });
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
      // Clear any existing participants
      setParticipants(new Map());
      if (videoGridRef.current) {
        videoGridRef.current.innerHTML = "";
      }

      const response = await accessTokenMutation.mutateAsync({
        roomName: roomName,
      });

      const token = response.data.data;

      const connectedRoom = await window.Twilio.Video.connect(token, {
        name: roomName,
        audio: true,
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: 24,
        },
      });

      console.log(
        "Room connected. Local participant:",
        connectedRoom.localParticipant.identity
      );
      console.log(
        "Existing remote participants:",
        connectedRoom.participants.size
      );

      setRoom(connectedRoom);

      // Add local participant
      addParticipant(connectedRoom.localParticipant, true);

      // Add existing remote participants
      connectedRoom.participants.forEach((participant: any) => {
        console.log(
          "Adding existing remote participant:",
          participant.identity
        );
        addParticipant(participant, false);
      });

      // Listen for new participants
      connectedRoom.on("participantConnected", (participant: any) => {
        console.log("New participant connected:", participant.identity);
        addParticipant(participant, false);
      });

      // Listen for participants leaving
      connectedRoom.on("participantDisconnected", (participant: any) => {
        console.log("Participant disconnected:", participant.identity);
        removeParticipant(participant.identity);
      });

      // Handle room disconnection
      connectedRoom.on("disconnected", (room: any, error: any) => {
        console.log("Room disconnected");
        if (error) {
          setError(`Disconnected: ${error.message}`);
        }
        setRoom(null);
        setParticipants(new Map());
        if (videoGridRef.current) {
          videoGridRef.current.innerHTML = "";
        }
      });
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

  // Calculate grid columns based on number of participants
  const getGridClass = () => {
    const count = participants.size;
    if (count === 1) return "grid-cols-1 max-w-2xl";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl";
    if (count === 3 || count === 4)
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-6xl";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl";
  };

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
                {room && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">
                    {participants.size} participant
                    {participants.size !== 1 ? "s" : ""}
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
        <div className="flex-1 w-full overflow-auto">
          <div className="w-full mx-auto px-4 md:px-6 py-6 pb-28">
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
                      Video calls require a secure HTTPS connection, especially
                      on mobile devices.
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

            {/* Video Grid */}
            {twilioLoaded && !isConnecting && (
              <div className="w-full">
                {/* Dynamic grid container for ALL participants */}
                <div
                  ref={videoGridRef}
                  className={`grid gap-4 w-full mx-auto ${getGridClass()}`}
                />

                {/* No participants message */}
                {room && participants.size <= 1 && (
                  <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800 mt-4">
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
