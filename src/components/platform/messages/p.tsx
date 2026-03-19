"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import ChatList from "./chatList";
import { tutorQuickResponses, studentQuickResponses } from "@/lib/utils";
import { ChatHeader, MessageBubble, MessageInput } from "./chatHeader";
import { MediaGatekeeper } from "./mediaComponents";
import { useEscapeClose } from "@/hooks/use-escape-close";
import {
  useGetStudentChatList,
  useGetTutorChatList,
  useGetChatMessages,
  useGetCurrentUser,
} from "@/lib/api/queries";
import { usePostMessage } from "@/lib/api/mutations";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import { Message } from "@/lib/types";
import { useSocketContext } from "@/context/SocketContext";

const MessagingPlatform = () => {
  const pathname = usePathname();
  const isTutorMode = pathname.includes("tutor");
  const { activeProfile } = useSelectedProfile();
  const [page, setPage] = useState(1);
  const [limit, _] = useState(100);

  const { data: chatListData } = isTutorMode
    ? useGetTutorChatList()
    : useGetStudentChatList({ childId: activeProfile?.id || "" });

  // Get current user data
  const { data: currentUserData } = useGetCurrentUser();

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch messages for the active chat
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isFetching,
  } = useGetChatMessages(activeChat || "", page, limit);

  // Message mutation
  const postMessageMutation = usePostMessage();

  const chatList = chatListData?.data || [];

  // Get socket from global context
  const { markAsRead, deleteMessages } = useSocketContext();

  const [newMessage, setNewMessage] = useState("");
  const [showChatList, setShowChatList] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousMessageCountRef = useRef(0);

  // Reset when chat changes - MUST come before the update effect
  const activeChatRef = useRef(activeChat);
  // Tracks the last message ID for which markAsRead was emitted, so we only
  // call it when a genuinely new message arrives rather than on every render.
  const lastMarkedReadIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeChat && activeChat !== activeChatRef.current) {
      activeChatRef.current = activeChat;
      setPage(1);
      setAllMessages([]);
      setHasMore(true);
      previousMessageCountRef.current = 0;
      lastMarkedReadIdRef.current = null;
    }
  }, [activeChat]);

  // Update messages when new data is fetched
  useEffect(() => {
    if (messagesData?.data) {
      const responseData = messagesData.data as any;
      const newMessages = responseData.messages || [];
      const pagination = responseData.pagination;

      if (page === 1) {
        // First page - replace all messages

        setAllMessages(newMessages);
        setHasMore(pagination?.hasNext ?? newMessages.length === limit);
      } else {
        // Subsequent pages - prepend older messages to the beginning
        setAllMessages((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((m) => m._id));
          const uniqueNewMessages = newMessages.filter(
            (m: Message) => !existingIds.has(m._id)
          );
          return [...uniqueNewMessages, ...prev];
        });
        setHasMore(pagination?.hasNext ?? newMessages.length === limit);
      }
    }
  }, [messagesData]);

  // Get current conversation messages
  const getCurrentMessages = useCallback(() => {
    return allMessages;
  }, [allMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Get current user ID for passing to ChatList
  const currentUserId = isTutorMode
    ? // @ts-ignore
    currentUserData?.data?.tutorProfile?.id
    : activeProfile?.id;

  useEffect(() => {
    if (!activeChat) return;

    const currentMessageCount = allMessages.length;

    if (
      previousMessageCountRef.current === 0 ||
      (page === 1 && currentMessageCount > previousMessageCountRef.current)
    ) {
      scrollToBottom();
    }

    previousMessageCountRef.current = currentMessageCount;
    inputRef.current?.focus();
  }, [allMessages, activeChat, scrollToBottom, page]);

  // Mark messages as read when the chat is opened OR when a new message
  // arrives while the chat is already open. Using a ref to track the last
  // marked message ID prevents the read→invalidate→refetch→read loop that
  // would occur if we called markAsRead on every allMessages reference change.
  useEffect(() => {
    if (!activeChat || !currentUserId || allMessages.length === 0) return;

    const lastMessage = allMessages[allMessages.length - 1];
    if (lastMessage._id === lastMarkedReadIdRef.current) return;

    lastMarkedReadIdRef.current = lastMessage._id;
    markAsRead(activeChat, currentUserId);
  }, [activeChat, currentUserId, allMessages, markAsRead]);

  useEscapeClose(() => {
    setActiveChat(null);
    setShowChatList(true);
  }, !!activeChat);

  const handleSendMessage = useCallback(
    (file?: File) => {
      // Determine the correct sender ID based on mode
      const senderId = isTutorMode
        ? // @ts-ignore
        currentUserData?.data?.tutorProfile?.id
        : activeProfile?.id;

      if ((newMessage.trim() || file) && activeChat && senderId) {
        postMessageMutation.mutate(
          {
            chatId: activeChat,
            senderId: senderId,
            senderName: isTutorMode
              ? // @ts-ignore
              currentUserData?.data?.firstName +
              " " +
              // @ts-ignore
              currentUserData?.data?.lastName
              : activeProfile?.name || "",
            content: newMessage,
            media: file,
          },
          {
            onSuccess: () => {
              setNewMessage("");
            },
          }
        );
      }
    },
    [
      newMessage,
      activeChat,
      isTutorMode,
      // @ts-ignore
      currentUserData?.data?.tutorProfile?.id,
      activeProfile?.id,
      postMessageMutation,
    ]
  );

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setShowChatList(false);
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleToggleSelection = (messageId: string) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedMessages.size > 0 && activeChat) {
      deleteMessages(activeChat, Array.from(selectedMessages));
      setSelectedMessages(new Set());
      setSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <>
      <MediaGatekeeper />
      <div className="h-[calc(100vh-4rem)] bg-gray-50 flex shadow-lg rounded-xl overflow-auto scrollbar-hide border border-gray-200">
        <div
          className={`md:hidden ${showChatList ? "block" : "hidden"} w-full`}
        >
          <ChatList
            chats={chatList}
            activeChat={activeChat}
            setActiveChat={handleSelectChat}
            setShowChatList={setShowChatList}
            isTutorMode={isTutorMode}
            currentUserId={currentUserId || ""}
          />
        </div>

        <div className="hidden md:block">
          <ChatList
            chats={chatList}
            activeChat={activeChat}
            setActiveChat={handleSelectChat}
            setShowChatList={setShowChatList}
            isTutorMode={isTutorMode}
            currentUserId={currentUserId || ""}
          />
        </div>

        <div
          className={`${showChatList ? "hidden md:flex" : "flex"
            } flex-1 flex-col`}
        >
          {activeChat && (
            <ChatHeader
              chats={chatList}
              activeChat={activeChat}
              setShowChatList={setShowChatList}
              isTutorMode={isTutorMode}
              selectionMode={selectionMode}
              selectedCount={selectedMessages.size}
              onToggleSelection={() => setSelectionMode(!selectionMode)}
              onDeleteSelected={handleDeleteSelected}
              onCancelSelection={handleCancelSelection}
            />
          )}

          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-200 to-gray-300"
          >
            <div className="max-w-3xl mx-auto h-full">
              {!activeChat ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="bg-gray-300 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isTutorMode ? "Select a student" : "Select a conversation"}
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    {isTutorMode
                      ? "Choose a student from the list to start helping with their studies."
                      : "Choose a chat from the list to start messaging."}
                  </p>
                </div>
              ) : messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-600">Loading messages...</div>
                </div>
              ) : (
                <>
                  {hasMore && getCurrentMessages().length > 0 && (
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isFetching}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isFetching
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
                          }`}
                      >
                        {isFetching ? (
                          <span className="flex items-center space-x-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Loading...</span>
                          </span>
                        ) : (
                          "Load More Messages"
                        )}
                      </button>
                    </div>
                  )}

                  {(() => {
                    const messages = getCurrentMessages();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const groups = new Map<string, Message[]>();
                    for (const m of messages) {
                      const d = m.createdAt ? new Date(m.createdAt) : null;
                      // Skip messages that haven't received a server timestamp yet
                      // (briefly true while the optimistic socket update is in flight)
                      if (!d || isNaN(d.getTime())) continue;
                      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(m);
                    }

                    const sortedKeys = Array.from(groups.keys()).sort();
                    const currentUserIdForBubble = isTutorMode
                      ? // @ts-ignore
                      currentUserData?.data?.tutorProfile?.id
                      : activeProfile?.id;

                    return sortedKeys.map((dateKey) => {
                      const dayMessages = groups.get(dateKey)!;
                      const firstDate = new Date(dayMessages[0].createdAt);
                      firstDate.setHours(0, 0, 0, 0);
                      let label: string;
                      if (firstDate.getTime() === today.getTime()) {
                        label = "Today";
                      } else if (firstDate.getTime() === yesterday.getTime()) {
                        label = "Yesterday";
                      } else {
                        label = firstDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      }
                      return (
                        <div key={dateKey} className="mb-4">
                          <div className="flex justify-center my-3">
                            <span className="text-xs font-medium text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full">
                              {label}
                            </span>
                          </div>
                          {dayMessages.map((message: Message) => (
                            <MessageBubble
                              key={message._id}
                              message={message}
                              chats={chatList}
                              activeChat={activeChat}
                              currentUserId={currentUserIdForBubble}
                              isSelected={selectedMessages.has(message._id)}
                              onSelect={() => handleToggleSelection(message._id)}
                              onDeselect={() => handleToggleSelection(message._id)}
                              onToggleSelection={() =>
                                setSelectionMode(!selectionMode)
                              }
                              selectionMode={selectionMode}
                            />
                          ))}
                        </div>
                      );
                    });
                  })()}

                  <div ref={messagesEndRef} className="pb-12" />
                </>
              )}
            </div>
          </div>

          {activeChat && (
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              inputRef={inputRef}
              isTutorMode={isTutorMode}
              quickResponses={
                isTutorMode ? tutorQuickResponses : studentQuickResponses
              }
            />
          )}
        </div>
      </div>
    </>
  );
};

export default MessagingPlatform;
