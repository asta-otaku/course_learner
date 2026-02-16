"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostTwilioAccessToken } from "@/lib/api/mutations";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2, Monitor, MonitorOff, Maximize2 } from "lucide-react";
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
  const [screenSharerName, setScreenSharerName] = useState<string>("");
  const [screenTrack, setScreenTrack] = useState<any>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const screenVideoRef = useRef<HTMLDivElement>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const screenTrackRef = useRef<any>(null);

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

  // Handle screen share track attachment/detachment using React lifecycle
  useEffect(() => {
    if (screenTrack && screenVideoRef.current) {
      console.log("📦 Attaching screen track to video element...");
      const videoElement = screenTrack.attach();
      videoElement.className = "w-full h-full object-contain bg-black";
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;

      // Replace the ref's content with the attached video
      if (screenVideoRef.current.firstChild) {
        screenVideoRef.current.removeChild(screenVideoRef.current.firstChild);
      }
      screenVideoRef.current.appendChild(videoElement);

      console.log("✅ Screen track attached via useEffect");

      // Cleanup function
      return () => {
        console.log("🧹 Cleaning up screen track from useEffect");
        if (screenVideoRef.current?.firstChild) {
          screenVideoRef.current.removeChild(screenVideoRef.current.firstChild);
        }
      };
    }
  }, [screenTrack]);

  const handleConnectedParticipant = (participant: any, isLocal = false) => {
    const participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.identity);
    participantDiv.setAttribute(
      "data-participant-type",
      isLocal ? "local" : "remote"
    );

    if (isLocal) {
      participantDiv.className =
        "w-full h-full rounded-lg overflow-hidden bg-gray-900 order-2 relative " +
        "md:absolute md:bottom-32 md:right-4 md:w-64 lg:w-72 xl:w-80 2xl:w-96 md:h-auto md:aspect-video " +
        "md:shadow-2xl md:border-2 md:border-gray-700 md:z-10 md:order-none";
    } else {
      participantDiv.className =
        "w-full h-full rounded-lg overflow-hidden bg-gray-900 order-1 md:order-none relative";
    }

    const placeholder = document.createElement("div");
    placeholder.className =
      "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900";
    placeholder.innerHTML = `
      <div class="text-center">
        <div class="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl md:text-4xl font-bold text-white">${participant.identity
        .substring(0, 2)
        .toUpperCase()}</span>
        </div>
        <p class="text-sm md:text-base text-gray-300 font-medium">${isLocal ? "You" : "Participant"
      }</p>
      </div>
    `;
    placeholder.style.display = "none";
    participantDiv.appendChild(placeholder);

    if (videoContainerRef.current) {
      videoContainerRef.current.appendChild(participantDiv);
    } else {
      console.error(`❌ videoContainerRef.current is null!`);
      return;
    }

    const updatePlaceholderVisibility = () => {
      const videos = Array.from(participantDiv.querySelectorAll("video"));
      const hasVisibleVideo = videos.some(
        (video: any) =>
          video.srcObject &&
          video.style.display !== "none" &&
          video.readyState >= 2
      );
      placeholder.style.display = hasVisibleVideo ? "none" : "flex";
    };

    const handleTrackPublication = (trackPublication: any) => {
      function displayTrack(track: any) {
        console.log(`📺 Displaying track: ${track.kind} (${track.name}) from ${isLocal ? 'local' : 'remote'}`);

        // Check if this is a screen share track
        if (track.name === 'myscreenshare' || track.name === 'screen-share') {
          console.log("🖥️ Screen share track detected from", isLocal ? "local" : "remote");

          // Track who is sharing
          if (isLocal) {
            setIsLocalScreenSharing(true);
            setScreenSharerName("You");
          } else {
            setIsLocalScreenSharing(false);
            setScreenSharerName(participant.identity || "Remote participant");
          }

          // Store track in state - React will handle rendering
          setScreenTrack(track);
          setIsScreenSharing(true);

          return; // Don't add to participant div
        }

        // Regular video/audio tracks
        const attachedElement = track.attach();

        if (track.kind === "video") {
          attachedElement.className = "w-full h-full object-contain rounded-lg";
          attachedElement.style.backgroundColor = "#000";
          attachedElement.autoplay = true;
          attachedElement.playsInline = true;
          attachedElement.muted = true;
        }

        participantDiv.insertBefore(attachedElement, placeholder);
        updatePlaceholderVisibility();

        attachedElement.addEventListener(
          "loadeddata",
          updatePlaceholderVisibility
        );
        attachedElement.addEventListener(
          "playing",
          updatePlaceholderVisibility
        );
      }

      function removeTrack(track: any) {
        console.log(`❌ Removing track: ${track.kind} (${track.name})`);

        // Handle screen share track removal
        if (track.name === 'myscreenshare' || track.name === 'screen-share') {
          console.log("❌ Screen share track removed");
          setScreenTrack(null);
          setIsScreenSharing(false);
          setIsLocalScreenSharing(false);
          setScreenSharerName("");
          return;
        }

        // Regular track removal
        const elements = participantDiv.querySelectorAll("video, audio");
        elements.forEach((el: any) => {
          if (el.srcObject?.getTracks().includes(track.mediaStreamTrack)) {
            el.remove();
          }
        });
        updatePlaceholderVisibility();
      }

      // For remote participants, track might not be subscribed yet
      if (trackPublication.track) {
        console.log(`✅ Track already available: ${trackPublication.track.kind}`);
        displayTrack(trackPublication.track);
      } else {
        console.log(`⏳ Waiting for track subscription...`);
      }

      // Listen for when the track gets subscribed (important for remote participants!)
      trackPublication.on("subscribed", (track: any) => {
        console.log(`✅ Track subscribed: ${track.kind} (${track.name})`);
        displayTrack(track);
      });

      trackPublication.on("unsubscribed", removeTrack);
      trackPublication.on("disabled", updatePlaceholderVisibility);
      trackPublication.on("enabled", updatePlaceholderVisibility);
    };

    // Handle existing tracks
    participant.tracks.forEach(handleTrackPublication);

    // Listen for new tracks being published (critical for screen sharing!)
    participant.on("trackPublished", (trackPublication: any) => {
      console.log(`📢 Track published: ${trackPublication.kind}`);
      handleTrackPublication(trackPublication);
    });

    // Handle track unpublishing
    participant.on("trackUnpublished", (publication: any) => {
      console.log(`📢 Track unpublished: ${publication.kind}`);
      if (publication.track) {
        if (publication.track.name === 'myscreenshare' || publication.track.name === 'screen-share') {
          setScreenTrack(null);
          setIsScreenSharing(false);
          setIsLocalScreenSharing(false);
          setScreenSharerName("");
        } else {
          const elements = participantDiv.querySelectorAll("video, audio");
          elements.forEach((el: any) => el.remove());
        }
      }
      updatePlaceholderVisibility();
    });

    updatePlaceholderVisibility();
  };

  const handleDisconnectedParticipant = (participant: any) => {
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
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = "";
      }

      const response = await accessTokenMutation.mutateAsync({
        roomName: roomName,
      });

      const token = response.data.data;

      const connectedRoom = await window.Twilio.Video.connect(token, {
        room: roomName,
      });

      setRoom(connectedRoom);

      handleConnectedParticipant(connectedRoom.localParticipant, true);
      connectedRoom.participants.forEach((participant: any) =>
        handleConnectedParticipant(participant, false)
      );
      connectedRoom.on("participantConnected", (participant: any) =>
        handleConnectedParticipant(participant, false)
      );

      connectedRoom.on(
        "participantDisconnected",
        handleDisconnectedParticipant
      );

      connectedRoom.on("disconnected", (room: any, error: any) => {
        if (error) {
          setError(`Disconnected: ${error.message}`);
        }
        setRoom(null);

        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = "";
        }
      });

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
      const participantDiv = document.getElementById(
        room.localParticipant.identity
      );

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

      if (participantDiv) {
        setTimeout(() => {
          const videos = participantDiv.querySelectorAll("video");
          videos.forEach((video: any) => {
            video.style.display = localVideoEnabled ? "none" : "block";
          });

          const placeholder = participantDiv.querySelector(
            ".absolute.inset-0"
          ) as HTMLElement;
          if (placeholder) {
            const hasVisibleVideo = Array.from(videos).some(
              (v: any) => v.style.display !== "none" && v.readyState >= 2
            );
            placeholder.style.display = hasVisibleVideo ? "none" : "flex";
          }
        }, 100);
      }
    }
  };

  const shareScreen = async () => {
    if (!room) {
      setError("Please join the room first");
      return;
    }

    try {
      console.log("🖥️ Starting screen share...");

      // Get screen stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 }
      });

      // Create Twilio LocalVideoTrack from screen stream
      const screenTrack = new window.Twilio.Video.LocalVideoTrack(
        stream.getTracks()[0],
        { name: 'myscreenshare' }
      );

      screenTrackRef.current = screenTrack;

      // Store track in state - useEffect will handle display
      setScreenTrack(screenTrack);
      setIsScreenSharing(true);
      setIsLocalScreenSharing(true);
      setScreenSharerName("You");

      // Publish to room so others can see
      await room.localParticipant.publishTrack(screenTrack);
      console.log("✅ Screen sharing published to room");

      // Handle when user stops sharing via browser UI
      screenTrack.once("stopped", () => {
        console.log("🛑 Screen sharing stopped via browser");
        // Clean up state
        screenTrackRef.current = null;
        setScreenTrack(null);
        setIsScreenSharing(false);
        setIsLocalScreenSharing(false);
        setScreenSharerName("");

        // Unpublish from room
        if (room && room.localParticipant) {
          const screenPubs: any = Array.from(room.localParticipant.videoTracks.values()).find(
            (pub: any) => pub.trackName === 'myscreenshare'
          );
          if (screenPubs && screenPubs.track) {
            room.localParticipant.unpublishTrack(screenPubs.track);
          }
        }
      });

    } catch (err: any) {
      console.error("❌ Screen share error:", err);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        setError("Failed to share screen. Please try again.");
      }
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current && room) {
      try {
        room.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
      } catch (e) {
        console.log("Error unpublishing track:", e);
      }

      screenTrackRef.current = null;
      setScreenTrack(null);
      setIsScreenSharing(false);
      setIsLocalScreenSharing(false);
      setScreenSharerName("");

      console.log("✅ Screen sharing stopped");
    }
  };

  const toggleFullscreen = async () => {
    if (!screenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await screenContainerRef.current.requestFullscreen();
        console.log("📺 Entered fullscreen mode");
      } else {
        await document.exitFullscreen();
        console.log("📺 Exited fullscreen mode");
      }
    } catch (err) {
      console.error("❌ Fullscreen error:", err);
    }
  };

  const leaveRoom = () => {
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
                  <span className="sm:hidden">●</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full px-4 md:px-6 py-4 flex-1 overflow-hidden">
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

          {/* Screen Share Display - Appears above videos when active */}
          {isScreenSharing && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">
                  {screenSharerName} {isLocalScreenSharing ? "are" : "is"} sharing screen
                </span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse ml-auto"></span>
              </div>
              <div
                ref={screenContainerRef}
                onClick={toggleFullscreen}
                className="bg-black rounded-lg overflow-hidden w-full aspect-video border-2 border-blue-500/30 relative cursor-pointer group transition-all hover:border-blue-400"
                title="Click to view fullscreen"
              >
                {/* React-managed video element for screen share */}
                <div ref={screenVideoRef} className="w-full h-full">
                  {/* Track will be attached here via useEffect */}
                </div>

                {/* Fullscreen indicator - shows on hover */}
                {screenTrack && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/20">
                    <div className="bg-black/70 rounded-full p-4">
                      <Maximize2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}

                {!screenTrack && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
                      <p className="text-gray-400 text-sm">Loading screen share...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-full h-full flex items-center justify-center">
            <div
              ref={videoContainerRef}
              className="w-full h-full max-h-full bg-gray-900 rounded-lg overflow-hidden
                         flex flex-col gap-2
                         md:relative md:flex-none md:aspect-video"
            />

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

        {room && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 md:px-6 py-4 md:py-5 z-50">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-3 md:gap-4">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${localAudioEnabled
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
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${localVideoEnabled
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
                onClick={isLocalScreenSharing ? stopScreenShare : shareScreen}
                size="lg"
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 ${isLocalScreenSharing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title={
                  isLocalScreenSharing
                    ? "Stop sharing"
                    : isScreenSharing
                      ? "Take over screen sharing"
                      : "Share screen"
                }
              >
                {isLocalScreenSharing ? (
                  <MonitorOff className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Monitor className="w-5 h-5 md:w-6 md:h-6" />
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
