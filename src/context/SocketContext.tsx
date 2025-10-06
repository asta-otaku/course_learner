"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { initSocket, getSocket } from "@/lib/services/socket";
import {
  SendMessageDto,
  MarkMessagesReadDto,
  JoinedRoomPayload,
} from "@/lib/types/socket";
import { Chat, Message } from "@/lib/types";
import { toast } from "react-toastify";
import { usePathname } from "next/navigation";

interface SocketContextType {
  isConnected: boolean;
  socket: ReturnType<typeof getSocket>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket());
  const [isConnected, setIsConnected] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const isMessagesPage = pathname?.includes("/messages");
  const isTutorMode = pathname?.includes("/tutor");

  // Check if socket should be initialized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const shouldInit = localStorage.getItem("initializeSocket") === "true";
      console.log(
        "🔍 SocketContext: Checking initialization flag:",
        shouldInit
      );
      setShouldConnect(shouldInit);
    }
  }, []);

  // Monitor shouldConnect changes and fetch chat list
  useEffect(() => {
    console.log("🔄 SocketContext: shouldConnect changed to:", shouldConnect);

    if (shouldConnect && isConnected) {
      console.log("📡 SocketContext: Fetching chat lists...");
      // Fetch the appropriate chat list based on user type
      const fetchChats = async () => {
        try {
          const { axiosInstance } = await import(
            "@/lib/services/axiosInstance"
          );

          if (isTutorMode) {
            const response = await axiosInstance.get("/chat/tutor");
            queryClient.setQueryData(["tutor-chat-list"], response.data);
            console.log("✅ SocketContext: Tutor chats loaded");
          } else {
            // For students, need to get active profile
            const activeProfile =
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem("activeProfile") || "{}")
                : {};
            if (activeProfile?.id) {
              const response = await axiosInstance.get(
                `/chat/child?childId=${activeProfile.id}`
              );
              queryClient.setQueryData(["student-chat-list"], response.data);
              console.log("✅ SocketContext: Student chats loaded");
            }
          }
        } catch (error) {
          console.error("❌ SocketContext: Failed to fetch chats", error);
        }
      };

      fetchChats();
    }
  }, [shouldConnect, isConnected, isTutorMode, queryClient]);

  useEffect(() => {
    if (!shouldConnect) return;

    console.log("🔌 SocketContext: Initializing socket connection...");
    const socket = initSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log("✅ SocketContext: Connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("❌ SocketContext: Disconnected");
      setIsConnected(false);
    };

    const handleMessageReceived = (payload: SendMessageDto) => {
      console.log("💬 SocketContext: Message received", payload);

      // Update messages cache
      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          console.log(
            "💬 SocketContext: Updating cache for chat:",
            payload.chatId
          );
          console.log("💬 SocketContext: Old data:", oldData);

          if (!oldData) {
            console.log("⚠️ SocketContext: No cache data, invalidating query");
            queryClient.invalidateQueries({
              queryKey: ["chat-messages", payload.chatId],
            });
            return oldData;
          }

          if (oldData.data?.messages) {
            const messageExists = oldData.data.messages.some(
              (msg: Message) => msg._id === payload._id
            );

            if (messageExists) {
              console.log("⚠️ SocketContext: Message already exists");
              return oldData;
            }

            console.log("✅ SocketContext: Adding message to cache");
            return {
              ...oldData,
              data: {
                ...oldData.data,
                messages: [...oldData.data.messages, payload],
              },
            };
          }

          console.log("⚠️ SocketContext: Data structure doesn't match");
          return oldData;
        }
      );

      // Update chat lists
      ["tutor-chat-list", "student-chat-list"].forEach((queryKey) => {
        queryClient.setQueryData([queryKey], (oldData: any) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((chat: Chat) => {
              if (chat._id === payload.chatId) {
                return {
                  ...chat,
                  lastMessagePreview: payload.content,
                  lastMessageAt: payload.createdAt,
                  unreadCount: (chat.unreadCount || 0) + 1,
                };
              }
              return chat;
            }),
          };
        });
      });

      // Show notification if not on messages page
      if (!isMessagesPage) {
        toast.info(
          `New message from ${payload.senderName}: ${payload.content}`,
          {
            position: "top-right",
            autoClose: 5000,
            onClick: () => {
              window.location.href = pathname.includes("/tutor")
                ? "/tutor/messages"
                : "/messages";
            },
          }
        );
      }
    };

    const handleMessageRead = (payload: MarkMessagesReadDto) => {
      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          if (!oldData?.data?.messages) return oldData;

          const messageIdsSet = new Set(payload.messageIds);

          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: oldData.data.messages.map((msg: Message) => {
                if (messageIdsSet.has(msg._id)) {
                  return {
                    ...msg,
                    isReadByRecipient: true,
                    readAt: new Date().toISOString(),
                  };
                }
                return msg;
              }),
            },
          };
        }
      );

      ["tutor-chat-list", "student-chat-list"].forEach((queryKey) => {
        queryClient.setQueryData([queryKey], (oldData: any) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((chat: Chat) => {
              if (chat._id === payload.chatId) {
                return { ...chat, unreadCount: 0 };
              }
              return chat;
            }),
          };
        });
      });
    };

    const handleMessageDeleted = (messageId: string) => {
      queryClient.setQueriesData(
        { queryKey: ["chat-messages"] },
        (oldData: any) => {
          if (!oldData?.data?.messages) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: oldData.data.messages.filter(
                (msg: Message) => msg._id !== messageId
              ),
            },
          };
        }
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("messageReceived", handleMessageReceived);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageDeleted", handleMessageDeleted);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("messageReceived", handleMessageReceived);
      socket.off("messageRead", handleMessageRead);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [queryClient, isMessagesPage, pathname, shouldConnect]);

  // Join chat rooms when available - also listen for chat list changes
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const socket = socketRef.current;

    let retryInterval: NodeJS.Timeout | null = null;

    const joinRooms = () => {
      console.log("🚪 SocketContext: Attempting to join rooms...");

      // Get chat lists from cache
      const tutorChats = queryClient.getQueryData<any>(["tutor-chat-list"]);
      const studentChats = queryClient.getQueryData<any>(["student-chat-list"]);
      const allChats = [
        ...(tutorChats?.data || []),
        ...(studentChats?.data || []),
      ];

      console.log("🚪 SocketContext: Found chats:", allChats.length);

      if (allChats.length === 0) {
        console.log("⚠️ SocketContext: No chats found yet, will retry...");
        return false;
      }

      allChats.forEach((chat) => {
        if (!joinedRoomsRef.current.has(chat._id)) {
          console.log("🚪 SocketContext: Joining room:", chat._id);
          socket.emit("joinRoom", chat._id);
          joinedRoomsRef.current.add(chat._id);
        }
      });

      console.log(
        "🚪 SocketContext: Currently in rooms:",
        Array.from(joinedRoomsRef.current)
      );
      return true;
    };

    // Try to join immediately
    const success = joinRooms();

    // If no chats found, retry every 2 seconds
    if (!success) {
      retryInterval = setInterval(() => {
        console.log("🔄 SocketContext: Retrying room join...");
        const joined = joinRooms();
        if (joined && retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      }, 2000);
    }

    // Subscribe to chat list changes (but debounce to avoid spam)
    let debounceTimeout: NodeJS.Timeout | null = null;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === "updated" &&
        (event?.query?.queryKey?.[0] === "tutor-chat-list" ||
          event?.query?.queryKey?.[0] === "student-chat-list")
      ) {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          console.log("🔄 SocketContext: Chat list updated, re-joining rooms");
          joinRooms();
        }, 500);
      }
    });

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (debounceTimeout) clearTimeout(debounceTimeout);
      unsubscribe();
    };
  }, [isConnected, queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
