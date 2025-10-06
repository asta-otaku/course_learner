"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { initSocket, getSocket, disconnectSocket } from "@/lib/services/socket";
import {
  SendMessageDto,
  SendMessageRequestDto,
  MarkMessagesReadDto,
  JoinedRoomPayload,
} from "@/lib/types/socket";
import { Chat, Message } from "@/lib/types";

interface UseSocketOptions {
  chatList: Chat[];
  activeChat: string | null;
  enabled?: boolean;
}

export const useSocket = ({
  chatList,
  activeChat,
  enabled = true,
}: UseSocketOptions) => {
  const queryClient = useQueryClient();
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef(getSocket());
  const activeChatRef = useRef(activeChat);

  // Keep activeChat ref in sync
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const socket = initSocket();
    socketRef.current = socket;

    console.log("🔌 Socket status before connect:", socket.connected);

    if (!socket.connected) {
      console.log("🔌 Initiating socket connection...");
      socket.connect();
    }

    return () => {};
  }, [enabled]);

  // Join chat rooms when chat list changes AND socket is connected
  useEffect(() => {
    if (!enabled || !socketRef.current || chatList.length === 0) return;

    const socket = socketRef.current;

    // Wait for socket to be connected before joining rooms
    const joinRooms = () => {
      if (!socket.connected) {
        console.log("⚠️ Socket not connected yet, waiting...");
        return;
      }

      console.log("🚪 Attempting to join rooms for", chatList.length, "chats");

      // Join new rooms
      chatList.forEach((chat) => {
        if (!joinedRoomsRef.current.has(chat._id)) {
          console.log("🚪 Joining room:", chat._id);
          // Backend expects just the chatId string, not an object
          socket.emit("joinRoom", chat._id);
          joinedRoomsRef.current.add(chat._id);
        }
      });

      console.log("🚪 Currently in rooms:", Array.from(joinedRoomsRef.current));

      // Leave rooms that are no longer in the list
      const currentChatIds = new Set(chatList.map((chat) => chat._id));
      joinedRoomsRef.current.forEach((roomId) => {
        if (!currentChatIds.has(roomId)) {
          console.log("🚪 Leaving room:", roomId);
          joinedRoomsRef.current.delete(roomId);
        }
      });
    };

    if (socket.connected) {
      // Socket is already connected, join immediately
      joinRooms();
    } else {
      // Wait for connection
      const onConnect = () => {
        console.log("✅ Socket connected, now joining rooms...");
        joinRooms();
      };

      socket.once("connect", onConnect);

      return () => {
        socket.off("connect", onConnect);
      };
    }
  }, [chatList, enabled]);

  // Handle incoming messages
  const handleMessageReceived = useCallback(
    (payload: SendMessageDto) => {
      console.log("💬 Received message for chat:", payload.chatId);
      console.log("💬 Current active chat:", activeChatRef.current);
      console.log("💬 Message content:", payload.content);

      // Update the specific chat's messages cache
      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          console.log("💬 Current cache data:", oldData);

          if (!oldData) {
            console.log(
              "⚠️ No cache data found, invalidating query to fetch fresh data"
            );
            // Invalidate the query so it refetches
            queryClient.invalidateQueries({
              queryKey: ["chat-messages", payload.chatId],
            });
            return oldData;
          }

          // For infinite query structure
          if (oldData.pages) {
            // Check if message already exists to prevent duplicates
            const messageExists = oldData.pages.some((page: any) =>
              page.data?.messages?.some(
                (msg: Message) => msg._id === payload._id
              )
            );

            if (messageExists) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page: any, index: number) => {
                // Add to the last page (most recent messages)
                if (index === oldData.pages.length - 1) {
                  return {
                    ...page,
                    data: {
                      ...page.data,
                      messages: [...(page.data?.messages || []), payload],
                    },
                  };
                }
                return page;
              }),
            };
          }

          // For regular query structure
          if (oldData.data?.messages) {
            // Check if message already exists to prevent duplicates
            const messageExists = oldData.data.messages.some(
              (msg: Message) => msg._id === payload._id
            );

            if (messageExists) {
              console.log("⚠️ Message already exists, skipping");
              return oldData;
            }

            console.log("✅ Adding message to regular query cache");
            const newData = {
              ...oldData,
              data: {
                ...oldData.data,
                messages: [...oldData.data.messages, payload],
              },
            };
            console.log("✅ Updated cache:", newData);
            return newData;
          }

          console.log("❌ Data structure doesn't match expected format");
          return oldData;
        }
      );

      // Update chat list with last message preview
      queryClient.setQueryData(["tutor-chat-list"], (oldData: any) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((chat: Chat) => {
            if (chat._id === payload.chatId) {
              return {
                ...chat,
                lastMessagePreview: payload.content,
                lastMessageAt: payload.createdAt,
                unreadCount:
                  payload.chatId !== activeChatRef.current
                    ? (chat.unreadCount || 0) + 1
                    : chat.unreadCount,
              };
            }
            return chat;
          }),
        };
      });

      queryClient.setQueryData(["student-chat-list"], (oldData: any) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((chat: Chat) => {
            if (chat._id === payload.chatId) {
              return {
                ...chat,
                lastMessagePreview: payload.content,
                lastMessageAt: payload.createdAt,
                unreadCount:
                  payload.chatId !== activeChatRef.current
                    ? (chat.unreadCount || 0) + 1
                    : chat.unreadCount,
              };
            }
            return chat;
          }),
        };
      });
    },
    [queryClient]
  );

  // Handle message read events
  const handleMessageRead = useCallback(
    (payload: MarkMessagesReadDto) => {
      // Update the messages in cache
      queryClient.setQueryData(
        ["chat-messages", payload.chatId],
        (oldData: any) => {
          if (!oldData) return oldData;

          const messageIdsSet = new Set(payload.messageIds);

          // For infinite query structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: {
                  ...page.data,
                  messages: page.data?.messages?.map((msg: Message) => {
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
              })),
            };
          }

          // For regular query structure
          if (oldData.data?.messages) {
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

          return oldData;
        }
      );

      // Update unread count in chat list
      ["tutor-chat-list", "student-chat-list"].forEach((queryKey) => {
        queryClient.setQueryData([queryKey], (oldData: any) => {
          if (!oldData?.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((chat: Chat) => {
              if (chat._id === payload.chatId) {
                return {
                  ...chat,
                  unreadCount: 0,
                };
              }
              return chat;
            }),
          };
        });
      });
    },
    [queryClient]
  );

  // Handle message deletion
  const handleMessageDeleted = useCallback(
    (messageId: string) => {
      // Remove from all chat message caches
      // We don't know which chat it belongs to, so we update all
      queryClient.setQueriesData(
        { queryKey: ["chat-messages"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          // For infinite query structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: {
                  ...page.data,
                  messages: page.data?.messages?.filter(
                    (msg: Message) => msg._id !== messageId
                  ),
                },
              })),
            };
          }

          // For regular query structure
          if (oldData.data?.messages) {
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

          return oldData;
        }
      );
    },
    [queryClient]
  );

  // Handle joined room confirmation
  const handleJoinedRoom = useCallback((payload: JoinedRoomPayload) => {
    console.log("✅ Room join confirmed by server:", payload);
  }, []);

  // Set up event listeners - only once on mount
  useEffect(() => {
    if (!enabled || !socketRef.current) return;

    const socket = socketRef.current;

    // Use wrapper functions to avoid recreating listeners
    const onMessageReceived = (payload: SendMessageDto) => {
      handleMessageReceived(payload);
    };

    const onMessageRead = (payload: MarkMessagesReadDto) => {
      handleMessageRead(payload);
    };

    const onMessageDeleted = (messageId: string) => {
      handleMessageDeleted(messageId);
    };

    const onJoinedRoom = (payload: JoinedRoomPayload) => {
      handleJoinedRoom(payload);
    };

    socket.on("messageReceived", onMessageReceived);
    socket.on("messageRead", onMessageRead);
    socket.on("messageDeleted", onMessageDeleted);
    socket.on("joinedRoom", onJoinedRoom);

    return () => {
      socket.off("messageReceived", onMessageReceived);
      socket.off("messageRead", onMessageRead);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("joinedRoom", onJoinedRoom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only re-run if enabled changes, NOT when handlers change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Leave all rooms on unmount
      if (socketRef.current) {
        joinedRoomsRef.current.forEach((roomId) => {
          // If your backend has a leaveRoom event, emit it here
          // socketRef.current?.emit("leaveRoom", { chatId: roomId });
        });
        joinedRoomsRef.current.clear();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
};
