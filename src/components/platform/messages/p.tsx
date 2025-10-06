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

  const { data: chatListData } = isTutorMode
    ? useGetTutorChatList()
    : useGetStudentChatList({ childId: activeProfile?.id || "" });

  // Get current user data
  const { data: currentUserData } = useGetCurrentUser();

  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Fetch messages for the active chat
  const { data: messagesData, isLoading: messagesLoading } = useGetChatMessages(
    activeChat || ""
  );

  // Message mutation
  const postMessageMutation = usePostMessage();

  const chatList = chatListData?.data || [];

  // Get socket from global context
  const { isConnected, markAsRead } = useSocketContext();

  const [newMessage, setNewMessage] = useState("");
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current conversation messages
  const getCurrentMessages = useCallback(() => {
    if (messagesData?.data) {
      return (messagesData.data as any).messages || [];
    }
    return [];
  }, [messagesData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Get current user ID for passing to ChatList
  const currentUserId = isTutorMode
    ? // @ts-ignore
      currentUserData?.data?.tutorProfile?.id
    : activeProfile?.id;

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
      inputRef.current?.focus();
      // Mark messages as read when viewing them
      // Send current user ID as senderId
      if (currentUserId) {
        markAsRead(activeChat, currentUserId);
      }
    }
  }, [
    getCurrentMessages,
    activeChat,
    scrollToBottom,
    markAsRead,
    currentUserId,
  ]);

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
        // Always use REST API for sending messages
        // The server will broadcast the message via socket to all connected clients
        // We'll receive it back via the messageReceived event for real-time updates
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
          className={`${
            showChatList ? "hidden md:flex" : "flex"
          } flex-1 flex-col`}
        >
          {activeChat && (
            <ChatHeader
              chats={chatList}
              activeChat={activeChat}
              setShowChatList={setShowChatList}
              isTutorMode={isTutorMode}
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
                  {getCurrentMessages().map((message: Message) => {
                    // Determine the correct user ID for comparison based on mode
                    const currentUserId = isTutorMode
                      ? // @ts-ignore
                        currentUserData?.data?.tutorProfile?.id
                      : activeProfile?.id;

                    return (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        chats={chatList}
                        activeChat={activeChat}
                        currentUserId={currentUserId}
                      />
                    );
                  })}

                  <div ref={messagesEndRef} />
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
