import { Chat, Message } from "@/lib/types";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
  X,
  CheckSquare,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { MediaMessage, TextMessage, MediaGatekeeper } from "./mediaComponents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ChatHeader = ({
  activeChat,
  chats,
  setShowChatList,
  isTutorMode,
  selectionMode = false,
  selectedCount = 0,
  onToggleSelection = () => {},
  onDeleteSelected = () => {},
  onCancelSelection = () => {},
}: {
  activeChat: string | null;
  chats: Chat[];
  setShowChatList: (show: boolean) => void;
  isTutorMode: boolean;
  selectionMode?: boolean;
  selectedCount?: number;
  onToggleSelection?: () => void;
  onDeleteSelected?: () => void;
  onCancelSelection?: () => void;
}) => {
  const currentChat = chats.find((chat) => chat.id === activeChat);
  const chatName = currentChat
    ? isTutorMode
      ? currentChat.childName
      : currentChat.tutorName
    : "";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectionMode) {
    return (
      <>
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancelSelection}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-blue-600" />
              </button>
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {selectedCount} message{selectedCount !== 1 ? "s" : ""}{" "}
                  selected
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {selectedCount > 0 && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Messages?</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-2">
                  <p>
                    Are you sure you want to delete {selectedCount} message
                    {selectedCount !== 1 ? "s" : ""}?
                  </p>
                  <p className="font-semibold text-amber-600">
                    ⚠️ Warning: This will delete the message
                    {selectedCount !== 1 ? "s" : ""} for both you and{" "}
                    {isTutorMode ? "the student" : "the tutor"}. This action
                    cannot be undone.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  // Prevent default form submission if any
                  e.preventDefault();
                  // Call the delete function
                  if (onDeleteSelected) {
                    onDeleteSelected();
                  }
                  // Close the dialog
                  setShowDeleteDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Messages
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowChatList(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {chatName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            {currentChat?.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">{chatName}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSelection}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Select messages to delete"
          >
            <CheckSquare className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageStatus = ({
  status,
  isUser,
}: {
  status?: string;
  isUser: boolean;
}) => {
  if (!isUser) return null;

  switch (status) {
    case "sending":
      return (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    case "sent":
      return (
        <div className="flex items-center space-x-1">
          <Check className="w-3 h-3 text-gray-400" />
        </div>
      );
    case "delivered":
      return (
        <div className="flex items-center space-x-1">
          <CheckCheck className="w-3 h-3 text-gray-400" />
        </div>
      );
    case "read":
      return (
        <div className="flex items-center space-x-1">
          <CheckCheck className="w-3 h-3 text-blue-500" />
        </div>
      );
    default:
      return null;
  }
};

export const MessageBubble = ({
  message,
  chats,
  activeChat,
  currentUserId,
  isSending = false,
  isSelected = false,
  onSelect = () => {},
  onDeselect = () => {},
  onToggleSelection = () => {},
  selectionMode = false,
}: {
  message: Message;
  chats: Chat[];
  activeChat: string | null;
  currentUserId?: string;
  isSending?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
  onToggleSelection?: () => void;
  selectionMode?: boolean;
}) => {
  const isUser = message.senderId === currentUserId;

  const handleMessageClick = () => {
    if (selectionMode && isUser) {
      // Toggle selection when clicking the message bubble
      if (isSelected) {
        onDeselect();
      } else {
        onSelect();
      }
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent triggering the message click
    // Since both onSelect and onDeselect toggle, just call onSelect
    // The toggle function will handle adding/removing from the set
    onSelect();
  };

  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent triggering the message click
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group ${
        selectionMode && isUser ? "cursor-pointer" : ""
      }`}
      onClick={handleMessageClick}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
          {message.senderName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
      )}

      <div className="relative">
        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl ${
            isUser
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-white text-gray-900 rounded-bl-md shadow-sm"
          } ${isSending ? "opacity-70" : ""} ${
            isSelected ? "ring-2 ring-blue-500 ring-opacity-75" : ""
          } ${
            selectionMode && isUser
              ? "hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50 transition-all"
              : ""
          }`}
        >
          <div className="px-3 py-2">
            {/* Display media if present */}
            {message.media && (
              <div className="mb-1.5">
                <MediaMessage
                  mediaUrl={message.media}
                  content={message.content}
                  isMe={isUser}
                />
              </div>
            )}

            {/* Display text content */}
            {message.content && (
              <TextMessage content={message.content} isMe={isUser} />
            )}

            <div
              className={`flex items-center justify-between mt-1 ${
                isUser ? "text-blue-100" : "text-gray-500"
              }`}
            >
              <span className="text-xs">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex items-center ml-2">
                {isUser && (
                  <MessageStatus status={message.status} isUser={isUser} />
                )}
                {isUser && !selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full ml-1">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={onToggleSelection}
                        className="text-blue-600 focus:text-blue-600"
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Select Messages
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isUser && selectionMode && (
                  <div
                    className="ml-2 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={handleCheckboxChange}
                      onClick={handleCheckboxClick}
                      className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs ml-2">
          You
        </div>
      )}
    </div>
  );
};

export const MessageInput = React.memo(
  ({
    newMessage,
    setNewMessage,
    handleSendMessage,
    inputRef,
    isTyping = false,
    isTutorMode = false,
    quickResponses = [],
  }: {
    newMessage: string;
    setNewMessage: (value: string) => void;
    handleSendMessage: (file?: File) => void;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    isTyping?: boolean;
    isTutorMode?: boolean;
    quickResponses?: string[];
  }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const quickResponsesRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(selectedFile || undefined);
        // Clear file after sending (same as Send button)
        if (selectedFile) {
          handleRemoveFile();
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      // Auto-resize textarea
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height =
          Math.min(inputRef.current.scrollHeight, 120) + "px";
      }
    };

    const onEmojiClick = (emojiObject: any) => {
      const emoji = emojiObject.emoji;
      const cursor = inputRef.current?.selectionStart || 0;
      const textBefore = newMessage.substring(0, cursor);
      const textAfter = newMessage.substring(cursor);
      const newText = textBefore + emoji + textAfter;

      setNewMessage(newText);

      // Focus back to input and set cursor position after emoji
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursor = cursor + emoji.length;
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    };

    const handleQuickResponse = (response: string) => {
      setNewMessage(response);
      setShowQuickResponses(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreview(null);
        }
      }
    };

    const handleFileClick = () => {
      fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleSendWithFile = () => {
      handleSendMessage(selectedFile || undefined);
      // Clear file after sending
      handleRemoveFile();
    };

    // Close emoji picker and quick responses when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target as Node)
        ) {
          setShowEmojiPicker(false);
        }
        if (
          quickResponsesRef.current &&
          !quickResponsesRef.current.contains(event.target as Node)
        ) {
          setShowQuickResponses(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="bg-white border-t border-gray-200 p-4 relative">
        {/* Quick Responses for Tutor Mode */}
        {isTutorMode && quickResponses.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Quick Responses
              </span>
              <button
                onClick={() => setShowQuickResponses(!showQuickResponses)}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                {showQuickResponses ? "Hide" : "Show"}
              </button>
            </div>
            {showQuickResponses && (
              <div
                ref={quickResponsesRef}
                className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto"
              >
                {quickResponses.map((response, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickResponse(response)}
                    className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    {response}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <button
            onClick={handleFileClick}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          <div className="flex-1 relative bg-gray-100 rounded-2xl">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={
                isTyping
                  ? "They are typing..."
                  : isTutorMode
                    ? "Type your response..."
                    : "Type your message..."
              }
              className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 max-h-32 text-sm"
              rows={1}
              disabled={isTyping}
            />
            <button
              className="absolute right-3 bottom-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <button
            onClick={handleSendWithFile}
            disabled={(!newMessage.trim() && !selectedFile) || isTyping}
            className={`p-3 rounded-full transition-all ${
              (newMessage.trim() || selectedFile) && !isTyping
                ? "bg-blue-500 hover:bg-blue-600 transform hover:scale-105"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={350}
              height={400}
              searchPlaceholder="Search emoji..."
              lazyLoadEmojis={true}
            />
          </div>
        )}
      </div>
    );
  }
);
