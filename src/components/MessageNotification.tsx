import React from "react";
import { X, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface MessageNotificationProps {
  senderName: string;
  message: string;
  onView: () => void;
  onClose: () => void;
}

export const MessageNotification: React.FC<MessageNotificationProps> = ({
  senderName,
  message,
  onView,
  onClose,
}) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[320px] max-w-[400px]">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm">
            {senderName || "New Message"}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{message}</p>

        <button
          onClick={onView}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          View Message
        </button>
      </div>
    </div>
  );
};
