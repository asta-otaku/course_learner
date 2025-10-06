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
import { usePathname, useRouter } from "next/navigation";
import { MessageNotification } from "@/components/MessageNotification";

interface SocketContextType {
  isConnected: boolean;
  socket: ReturnType<typeof getSocket>;
  markAsRead: (chatId: string, subjectId: string) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
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
  const router = useRouter();
  const isMessagesPage = pathname?.includes("/messages");
  const isTutorMode = pathname?.includes("/tutor");

  // Function to mark messages as read
  const markAsRead = useCallback((chatId: string, subjectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("markAsRead", { chatId, subjectId });
    } else {
      console.log("❌ Socket not connected, cannot emit markAsRead");
    }
  }, []);

  // Function to delete messages
  const deleteMessages = useCallback((chatId: string, messageIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("deleteMessage", { chatId, messageIds });
    } else {
      console.log("❌ Socket not connected, cannot emit deleteMessages");
    }
  }, []);

  // Check if socket should be initialized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initFlag = localStorage.getItem("initializeSocket");
      const shouldInit = initFlag === "true";
      setShouldConnect(shouldInit);
    }
  }, []);

  // Monitor shouldConnect changes and fetch chat list
  useEffect(() => {
    if (shouldConnect && isConnected) {
      // Fetch the appropriate chat list based on user type
      const fetchChats = async () => {
        try {
          const { axiosInstance } = await import(
            "@/lib/services/axiosInstance"
          );

          if (isTutorMode) {
            const response = await axiosInstance.get("/chat/tutor");
            queryClient.setQueryData(["tutor-chat-list"], response.data);
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
            }
          }
        } catch (error) {
          // Silent fail - chat list will be loaded by components
        }
      };

      fetchChats();
    }
  }, [shouldConnect, isConnected, isTutorMode, queryClient]);

  useEffect(() => {
    if (!shouldConnect) {
      return;
    }

    const socket = initSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessageReceived = (payload: SendMessageDto) => {
      // Update messages cache
      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          if (!oldData) {
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
              return oldData;
            }

            return {
              ...oldData,
              data: {
                ...oldData.data,
                messages: [...oldData.data.messages, payload],
              },
            };
          }

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
        const handleView = () => {
          const messagesPath = isTutorMode ? "/tutor/messages" : "/messages";
          router.push(messagesPath);
          toast.dismiss();
        };

        toast(
          ({ closeToast }) => (
            <MessageNotification
              senderName={payload.senderName || "Student"}
              message={payload.content}
              onView={handleView}
              onClose={() => closeToast?.()}
            />
          ),
          {
            position: "top-right",
            autoClose: false,
            closeButton: false,
            style: { background: "transparent", boxShadow: "none", padding: 0 },
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

          const updatedData = {
            ...oldData,
            data: oldData.data.map((chat: Chat) => {
              // Try both _id and id for compatibility
              if (
                chat._id === payload.chatId ||
                (chat as any).id === payload.chatId
              ) {
                return { ...chat, unreadCount: 0 };
              }
              return chat;
            }),
          };

          return updatedData;
        });

        // Invalidate queries to force re-render
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    const handleMessageDeleted = (payload: {
      chatId: string;
      messageIds: string[];
    }) => {
      const messageIdsSet = new Set(payload.messageIds);

      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          if (!oldData?.data?.messages) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: oldData.data.messages.filter(
                (msg: Message) => !messageIdsSet.has(msg._id)
              ),
            },
          };
        }
      );

      // Update chat lists to remove deleted messages from last message preview
      ["tutor-chat-list", "student-chat-list"].forEach((queryKey) => {
        queryClient.setQueryData([queryKey], (oldData: any) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((chat: Chat) => {
              if (
                chat._id === payload.chatId ||
                (chat as any).id === payload.chatId
              ) {
                // If the last message was deleted, we might need to update the preview
                // This is a simplified approach - you might want to fetch the new last message
                return chat;
              }
              return chat;
            }),
          };
        });

        // Invalidate queries to force re-render
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Also invalidate the messages query to force re-render
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", payload.chatId],
      });
    };

    const handleConnectError = (error: any) => {
      // Connection error handling
    };

    const handleJoinedRoom = (payload: JoinedRoomPayload) => {
      // Room joined successfully
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("messageReceived", handleMessageReceived);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("joinedRoom", handleJoinedRoom);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("messageReceived", handleMessageReceived);
      socket.off("messageRead", handleMessageRead);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("joinedRoom", handleJoinedRoom);
    };
  }, [queryClient, isMessagesPage, pathname, shouldConnect]);

  // Join chat rooms when available - also listen for chat list changes
  useEffect(() => {
    if (!isConnected || !socketRef.current) {
      return;
    }

    const socket = socketRef.current;
    let retryInterval: NodeJS.Timeout | null = null;

    const joinRooms = () => {
      // Get chat lists from cache
      const tutorChats = queryClient.getQueryData<any>(["tutor-chat-list"]);
      const studentChats = queryClient.getQueryData<any>(["student-chat-list"]);
      const allChats = [
        ...(tutorChats?.data || []),
        ...(studentChats?.data || []),
      ];

      if (allChats.length === 0) {
        return false;
      }

      allChats.forEach((chat) => {
        if (!joinedRoomsRef.current.has(chat._id)) {
          socket.emit("joinRoom", { chatId: chat._id });
          joinedRoomsRef.current.add(chat._id);
        }
      });

      return true;
    };

    // Try to join immediately
    const success = joinRooms();

    // If no chats found, retry every 2 seconds
    if (!success) {
      retryInterval = setInterval(() => {
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
    <SocketContext.Provider
      value={{
        isConnected,
        socket: socketRef.current,
        markAsRead,
        deleteMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
