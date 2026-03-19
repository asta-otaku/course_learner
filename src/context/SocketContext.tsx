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
import { initSocket, getSocket, getAccessToken, setSocketQueryToken } from "@/lib/services/socket";
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

  // Derived values kept in refs so socket event handlers always read the latest
  // values without needing to be re-created (which would require re-registering
  // all listeners and re-running the socket setup effect).
  const isMessagesPage = pathname?.includes("/messages");
  const isTutorMode = pathname?.includes("/tutor");

  const isMessagesPageRef = useRef(isMessagesPage);
  const isTutorModeRef = useRef(isTutorMode);
  const routerRef = useRef(router);

  useEffect(() => {
    isMessagesPageRef.current = isMessagesPage;
    isTutorModeRef.current = isTutorMode;
    routerRef.current = router;
  }, [isMessagesPage, isTutorMode, router]);

  // Function to mark messages as read
  const markAsRead = useCallback((chatId: string, subjectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("markAsRead", { chatId, subjectId });
    }
  }, []);

  // Function to delete messages
  const deleteMessages = useCallback((chatId: string, messageIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("deleteMessage", { chatId, messageIds });
    }
  }, []);

  // Decide whether to connect. Re-checks on pathname change (covers tutor login
  // redirect) and listens for storage events (covers cross-tab login).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const initFlag = localStorage.getItem("initializeSocket") === "true";
      const token = getAccessToken();
      setShouldConnect(initFlag || !!token);
    };

    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [pathname]);

  // Fetch chat list once connected so rooms can be joined immediately
  useEffect(() => {
    if (!shouldConnect || !isConnected) return;

    const fetchChats = async () => {
      try {
        const { axiosInstance } = await import("@/lib/services/axiosInstance");

        if (isTutorModeRef.current) {
          const response = await axiosInstance.get("/chat/tutor", {
            skipAuthRedirect: true,
          });
          queryClient.setQueryData(["tutor-chat-list"], response.data);
        } else {
          const activeProfile =
            typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("activeProfile") || "{}")
              : {};
          if (activeProfile?.id) {
            const response = await axiosInstance.get(
              `/chat/child?childId=${activeProfile.id}`,
              { skipAuthRedirect: true }
            );
            queryClient.setQueryData(["student-chat-list"], response.data);
          }
        }
      } catch {
        // Silent fail – chat list will be loaded by page components
      }
    };

    fetchChats();
  }, [shouldConnect, isConnected, queryClient]);

  // Core socket setup. Only depends on queryClient and shouldConnect so it is
  // NOT torn down on every navigation. isMessagesPage / isTutorMode / router
  // are accessed via refs inside the handlers instead.
  useEffect(() => {
    if (!shouldConnect) return;

    const socket = initSocket();
    socketRef.current = socket;
    const token = getAccessToken();
    if (token) setSocketQueryToken(token);

    const handleConnect = () => {
      // Clear joined rooms so every room is re-joined after a reconnect.
      // Without this, the server does not know the client is in any room after
      // a disconnect/reconnect cycle, causing silent event drops.
      joinedRoomsRef.current.clear();
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessageReceived = (payload: SendMessageDto) => {
      // Determine if this message was sent by the current user so we don't
      // count their own outgoing messages as unread.
      const currentUserData = queryClient.getQueryData<any>(["current-user"]);
      const currentTutorId = currentUserData?.data?.tutorProfile?.id;
      const activeProfileRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("activeProfile")
          : null;
      const currentStudentId = activeProfileRaw
        ? JSON.parse(activeProfileRaw).id
        : null;
      const currentUserId = isTutorModeRef.current
        ? currentTutorId
        : currentStudentId;
      const isOwnMessage = !!currentUserId && payload.senderId === currentUserId;

      // Update messages cache for page 1
      queryClient.setQueryData(
        ["chat-messages", payload.chatId, 1],
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
            if (messageExists) return oldData;

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

      // Update chat list previews
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
                  // Only increment unread count for messages from others
                  unreadCount: isOwnMessage
                    ? (chat.unreadCount || 0)
                    : (chat.unreadCount || 0) + 1,
                };
              }
              return chat;
            }),
          };
        });
      });

      // Show toast notification when the user is on a different page.
      // Use refs so we always read the current pathname without re-creating the handler.
      if (!isMessagesPageRef.current) {
        const handleView = () => {
          const messagesPath = isTutorModeRef.current
            ? "/tutor/messages"
            : "/messages";
          routerRef.current.push(messagesPath);
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
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", payload.chatId],
      });

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
                return { ...chat, unreadCount: 0 };
              }
              return chat;
            }),
          };
        });

        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    const handleMessageDeleted = (payload: {
      chatId: string;
      messageIds: string[];
    }) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", payload.chatId],
      });

      ["tutor-chat-list", "student-chat-list"].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    const handleConnectError = () => {
      const freshToken = getAccessToken();
      if (freshToken) setSocketQueryToken(freshToken);
    };

    const handleJoinedRoom = (_payload: JoinedRoomPayload) => {
      // intentionally empty – room join confirmed
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("messageReceived", handleMessageReceived);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("joinedRoom", handleJoinedRoom);

    if (token && !socket.connected) {
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
  }, [queryClient, shouldConnect]);

  // Connect the socket when a token becomes available (handles tutor login redirect)
  useEffect(() => {
    if (!shouldConnect) return;
    const token = getAccessToken();
    if (!token || !socketRef.current) return;
    if (socketRef.current.connected) return;
    setSocketQueryToken(token);
    socketRef.current.connect();
  }, [shouldConnect, pathname]);

  // Join chat rooms. Clears and retries whenever isConnected flips to true
  // (including after a reconnect, since handleConnect clears joinedRoomsRef).
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const socket = socketRef.current;
    let retryInterval: NodeJS.Timeout | null = null;

    const joinRooms = () => {
      const tutorChats = queryClient.getQueryData<any>(["tutor-chat-list"]);
      const studentChats = queryClient.getQueryData<any>(["student-chat-list"]);
      const allChats = [
        ...(tutorChats?.data || []),
        ...(studentChats?.data || []),
      ];

      if (allChats.length === 0) return false;

      allChats.forEach((chat) => {
        if (!joinedRoomsRef.current.has(chat._id)) {
          socket.emit("joinRoom", { chatId: chat._id });
          joinedRoomsRef.current.add(chat._id);
        }
      });

      return true;
    };

    const success = joinRooms();

    // Retry every 2 s until the chat list is available in cache
    if (!success) {
      retryInterval = setInterval(() => {
        if (joinRooms() && retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      }, 2000);
    }

    // Also join any new rooms that arrive after the initial load
    let debounceTimeout: NodeJS.Timeout | null = null;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === "updated" &&
        (event?.query?.queryKey?.[0] === "tutor-chat-list" ||
          event?.query?.queryKey?.[0] === "student-chat-list")
      ) {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(joinRooms, 500);
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
