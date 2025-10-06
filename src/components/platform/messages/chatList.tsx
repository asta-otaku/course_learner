import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreVertical,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Chat } from "@/lib/types";
import { useDeleteChatById, usePutChatById } from "@/lib/api/mutations";
import { useSocketContext } from "@/context/SocketContext";
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

// Individual chat item component that can use hooks
const ChatItem = ({
  chat,
  activeChat,
  setActiveChat,
  setShowChatList,
  isTutorMode,
  currentUserId,
}: {
  chat: Chat;
  activeChat: string | null;
  setActiveChat: (id: string) => void;
  setShowChatList: (show: boolean) => void;
  isTutorMode: boolean;
  currentUserId: string;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteChatMutation = useDeleteChatById(chat.id);
  const updateChatMutation = usePutChatById(chat.id);
  const { markAsRead } = useSocketContext();

  const handleDeleteChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDeleteChat = async () => {
    try {
      await deleteChatMutation.mutateAsync();
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleArchiveChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateChatMutation.mutate({
      tutorName: chat.tutorName,
      childName: chat.childName,
      isArchived: true,
    });
  };

  const handleUnarchiveChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateChatMutation.mutate({
      tutorName: chat.tutorName,
      childName: chat.childName,
      isArchived: false,
    });
  };

  const unreadCount = chat.unreadCount;
  const lastMessage = chat.lastMessagePreview || "No messages yet";
  const lastTime = chat.lastMessageAt
    ? new Date(chat.lastMessageAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const chatName = isTutorMode ? chat.childName : chat.tutorName;

  return (
    <>
      <div
        className={`p-4 border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 group ${
          activeChat === chat.id
            ? "bg-blue-50 border-l-4 border-l-blue-500"
            : ""
        }`}
      >
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => {
            setActiveChat(chat.id);
            setShowChatList(false);
            // Send current user ID as senderId
            markAsRead(chat.id, currentUserId);
          }}
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              {chatName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3
                className={`font-medium truncate ${
                  unreadCount > 0
                    ? "text-gray-900 font-semibold"
                    : "text-gray-900"
                }`}
              >
                {chatName}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-textSubtitle whitespace-nowrap">
                  {lastTime}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleArchiveChat}
                      className="text-orange-600 focus:text-orange-600"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleUnarchiveChat}
                      className="text-green-600 focus:text-green-600"
                    >
                      <ArchiveRestore className="w-4 h-4 mr-2" />
                      Unarchive Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeleteChat}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <p
                className={`text-sm truncate ${
                  unreadCount > 0
                    ? "text-gray-900 font-medium"
                    : "text-textSubtitle"
                }`}
              >
                {lastMessage}
              </p>
              {unreadCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat conversation. This action
              cannot be undone and all messages in this chat will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChat}
              disabled={deleteChatMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteChatMutation.isPending ? "Deleting..." : "Delete Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

function ChatList({
  chats,
  activeChat,
  setActiveChat,
  setShowChatList,
  isTutorMode,
  currentUserId,
}: {
  chats: Chat[];
  activeChat: string | null;
  setActiveChat: (id: string) => void;
  setShowChatList: (show: boolean) => void;
  isTutorMode: boolean;
  currentUserId: string;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredChats = chats.filter((chat) => {
    const chatName = isTutorMode ? chat.childName : chat.tutorName;
    return chatName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate total unread messages across all conversations
  const getTotalUnreadCount = () => {
    return chats.reduce((total, chat) => total + chat.unreadCount, 0);
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative">
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
              {getTotalUnreadCount()}
            </span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 h-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-gray-300 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No conversations found
            </h3>
            <p className="text-gray-600 max-w-sm">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Start a conversation to begin messaging."}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              setShowChatList={setShowChatList}
              isTutorMode={isTutorMode}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ChatList;
