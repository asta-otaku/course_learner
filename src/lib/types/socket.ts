// Socket Event Types

// Type for sending a message TO the server
export interface SendMessageRequestDto {
  chatId: string;
  senderId: string;
  content: string;
  media?: string | null;
}

// Type for receiving a message FROM the server (full message object)
export interface SendMessageDto {
  _id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  media: string | null;
  type: string;
  status: string;
  isReadByRecipient: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkMessagesReadDto {
  chatId: string;
  messageIds: string[];
  readBy: string;
}

// Backend sends this when you join a room
export interface JoinedRoomPayload {
  message: string;
  timestamp: string;
  payload: string; // The chatId
}

export interface ServerToClientEvents {
  messageReceived: (payload: SendMessageDto) => void;
  messageRead: (payload: MarkMessagesReadDto) => void;
  joinedRoom: (payload: JoinedRoomPayload) => void;
  messageDeleted: (payload: string) => void;
  messageNotSent: (payload: { message: string; description: string }) => void;
}

export interface ClientToServerEvents {
  joinRoom: (chatId: string) => void; // Backend expects just the chatId string
  sendMessage: (payload: SendMessageRequestDto) => void;
  markAsRead: (payload: MarkMessagesReadDto) => void;
}

