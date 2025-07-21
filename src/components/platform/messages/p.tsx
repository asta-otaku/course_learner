"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import ChatList from "./chatList";
import {
  chats,
  dummyProfiles,
  tutorQuickResponses,
  studentQuickResponses,
  generateTutorResponse,
  generateStudentResponse,
} from "@/lib/utils";
import { ChatHeader, MessageBubble, MessageInput } from "./chatHeader";
import { useEscapeClose } from "@/hooks/use-escape-close";

// Message status types
type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  type: string;
  read: boolean;
  status?: MessageStatus;
}

interface ConversationHistory {
  [chatId: string]: Message[];
}

const MessagingPlatform = () => {
  const pathname = usePathname();
  const isTutorMode = pathname.includes("tutor");

  // Generate chat list based on mode
  const getChatList = useCallback(() => {
    if (isTutorMode) {
      // For tutors, use dummyProfiles to create chat list
      return dummyProfiles
        .filter((profile) => profile.status === "active")
        .map((profile, index) => ({
          id: profile.id,
          name: profile.name,
          role: `Year ${profile.year} Student`,
          avatar: "/api/placeholder/50/50",
          lastMessage: `Last message from ${profile.name}`,
          lastTime: index % 2 === 0 ? "10:32 AM" : "9:45 AM",
          unread: index % 3 === 0 ? 2 : 0,
          online: index % 2 === 0,
        }));
    } else {
      // For students, use existing chats
      return chats;
    }
  }, [isTutorMode]);

  const chatList = getChatList();

  // Initialize conversation history with context-appropriate messages
  const initializeConversationHistory = (): ConversationHistory => {
    const history: ConversationHistory = {};

    chatList.forEach((chat, index) => {
      if (isTutorMode) {
        // Tutor-centric default messages
        const defaultMsgs: Message[] = [
          {
            id: Date.now() + Math.random(),
            sender: chat.id,
            text: `Hi! I'm ${chat.name}. I'm working on my ${
              index % 2 === 0 ? "math" : "science"
            } homework and I have a question.`,
            timestamp: "10:30 AM",
            type: "text",
            read: false,
            status: "sent",
          },
          {
            id: Date.now() + Math.random() + 1,
            sender: "user",
            text: `Hello ${
              chat.name
            }! I'm here to help. What question do you have about your ${
              index % 2 === 0 ? "math" : "science"
            } homework?`,
            timestamp: "10:32 AM",
            type: "text",
            read: true,
            status: "read",
          },
          {
            id: Date.now() + Math.random() + 2,
            sender: chat.id,
            text:
              index % 2 === 0
                ? "I'm stuck on the quadratic equations. Can you explain how to solve them?"
                : "I don't understand the photosynthesis process. Can you help?",
            timestamp: "10:35 AM",
            type: "text",
            read: false,
            status: "sent",
          },
        ];

        history[chat.id] = defaultMsgs;
      } else {
        // Student-centric default messages
        const defaultMsgs: Message[] = [
          {
            id: Date.now() + Math.random(),
            sender: "tutor",
            text: `Hello! I'm your tutor. How can I help you with your studies today?`,
            timestamp: "10:30 AM",
            type: "text",
            read: false,
            status: "sent",
          },
          {
            id: Date.now() + Math.random() + 1,
            sender: "user",
            text: "Hi! I have a question about the calculus lesson.",
            timestamp: "10:32 AM",
            type: "text",
            read: true,
            status: "read",
          },
        ];

        history[chat.id] = defaultMsgs;
      }
    });

    return history;
  };

  const [conversationHistory, setConversationHistory] =
    useState<ConversationHistory>(initializeConversationHistory);
  const [newMessage, setNewMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessages, setSendingMessages] = useState<Set<number>>(
    new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current conversation messages
  const getCurrentMessages = useCallback(() => {
    if (!activeChat) return [];
    return conversationHistory[activeChat] || [];
  }, [activeChat, conversationHistory]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [getCurrentMessages, activeChat, scrollToBottom]);

  useEscapeClose(() => {
    setActiveChat(null);
    setShowChatList(true);
  }, !!activeChat);

  // Simulate message status updates
  const updateMessageStatus = useCallback(
    (messageId: number, status: MessageStatus) => {
      if (!activeChat) return;

      setConversationHistory((prev) => ({
        ...prev,
        [activeChat]: prev[activeChat].map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
      }));
    },
    [activeChat]
  );

  // Simulate typing indicator
  const simulateTyping = useCallback((chatId: string) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000 + Math.random() * 2000);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && activeChat) {
      const messageId = Date.now();
      const message: Message = {
        id: messageId,
        sender: "user",
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        read: true,
        status: "sending",
      };

      // Add message to current conversation
      setConversationHistory((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), message],
      }));

      setSendingMessages((prev) => new Set(prev).add(messageId));
      setNewMessage("");

      // Simulate message sending process
      setTimeout(() => updateMessageStatus(messageId, "sent"), 500);
      setTimeout(() => updateMessageStatus(messageId, "delivered"), 1000);
      setTimeout(() => updateMessageStatus(messageId, "read"), 1500);

      // Get the chat name for the response
      const chatName =
        chatList.find((chat) => chat.id === activeChat)?.name || activeChat;

      // Simulate typing indicator
      setTimeout(() => simulateTyping(activeChat), 2000);

      // Send response after typing
      setTimeout(() => {
        const responseId = Date.now() + 1;
        const responseText = isTutorMode
          ? generateTutorResponse(chatName, newMessage)
          : generateStudentResponse(chatName, newMessage);

        const response: Message = {
          id: responseId,
          sender: activeChat,
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "text",
          read: false,
          status: "sent",
        };

        // Add response to current conversation
        setConversationHistory((prev) => ({
          ...prev,
          [activeChat]: [...(prev[activeChat] || []), response],
        }));

        // Mark response as read after a delay
        setTimeout(() => {
          setConversationHistory((prev) => ({
            ...prev,
            [activeChat]: prev[activeChat].map((msg) =>
              msg.id === responseId
                ? { ...msg, read: true, status: "read" }
                : msg
            ),
          }));
        }, 1000);
      }, 4000);
    }
  }, [
    newMessage,
    activeChat,
    chatList,
    isTutorMode,
    updateMessageStatus,
    simulateTyping,
  ]);

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setShowChatList(false);

    // Mark all messages from this chat as read
    setConversationHistory((prev) => ({
      ...prev,
      [id]: (prev[id] || []).map((msg) =>
        (msg.sender === id || msg.sender === "tutor") && msg.sender !== "user"
          ? { ...msg, read: true, status: "read" }
          : msg
      ),
    }));
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex shadow-lg rounded-xl overflow-auto scrollbar-hide border border-gray-200">
      <div className={`md:hidden ${showChatList ? "block" : "hidden"} w-full`}>
        <ChatList
          chats={chatList}
          activeChat={activeChat}
          setActiveChat={handleSelectChat}
          setShowChatList={setShowChatList}
          conversationHistory={conversationHistory}
        />
      </div>

      <div className="hidden md:block">
        <ChatList
          chats={chatList}
          activeChat={activeChat}
          setActiveChat={handleSelectChat}
          setShowChatList={setShowChatList}
          conversationHistory={conversationHistory}
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
          />
        )}

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-200 to-gray-300">
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
            ) : (
              <>
                {getCurrentMessages().map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    chats={chatList}
                    activeChat={activeChat}
                    isSending={sendingMessages.has(message.id)}
                  />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
                      {chatList
                        .find((chat) => chat.id === activeChat)
                        ?.name.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

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
            isTyping={isTyping}
            isTutorMode={isTutorMode}
            quickResponses={
              isTutorMode ? tutorQuickResponses : studentQuickResponses
            }
          />
        )}
      </div>
    </div>
  );
};

export default MessagingPlatform;
