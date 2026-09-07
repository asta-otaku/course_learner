import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  APIGetResponse,
  Chat,
  Message,
  Analytics,
  TutorAnalytics,
  SupportTicket,
  ChangeRequest,
} from "../../types";

// Chats
export const useGetTutorChatList = (enabled = true) => {
  return useQuery({
    queryKey: ["tutor-chat-list"],
    queryFn: async (): Promise<APIGetResponse<Chat[]>> => {
      const response = await axiosInstance.get("/chat/tutor");
      return response.data;
    },
    enabled,
  });
};

export const useGetStudentChatList = ({ childId }: { childId: string }) => {
  return useQuery({
    queryKey: ["student-chat-list", childId],
    queryFn: async (): Promise<APIGetResponse<Chat[]>> => {
      const response = await axiosInstance.get(
        `/chat/child?childId=${childId}`
      );
      return response.data;
    },
    enabled: !!childId,
  });
};

export const useGetChatMessages = (
  chatId: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ["chat-messages", chatId, page],
    queryFn: async (): Promise<APIGetResponse<Message[]>> => {
      const response = await axiosInstance.get(
        `/chat/${chatId}/messages?page=${page}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!chatId,
  });
};

export const useGetChatById = (chatId: string) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: async (): Promise<APIGetResponse<Chat>> => {
      const response = await axiosInstance.get(`/chat/${chatId}`);
      return response.data;
    },
    enabled: !!chatId,
  });
};

// Analytics Queries
export const useGetAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<APIGetResponse<Analytics>> => {
      const response = await axiosInstance.get("/analytics");
      return response.data;
    },
  });
};

export const useGetTutorAnalytics = (tutorId: string) => {
  return useQuery({
    queryKey: ["tutor-analytics", tutorId],
    queryFn: async (): Promise<APIGetResponse<TutorAnalytics>> => {
      const response = await axiosInstance.get(`/analytics/tutor/${tutorId}`);
      return response.data;
    },
    enabled: !!tutorId,
  });
};

// Activity Queries
export const useGetActivityLog = (cursor?: string, limit?: number) => {
  return useQuery({
    queryKey: ["activity-log", cursor, limit],
    queryFn: async (): Promise<{
      status: string;
      message: string;
      data: {
        message: string;
        timestamp: string;
      }[];
      pagination: {
        nextCursor: string | null;
        hasMore: boolean;
      };
    }> => {
      const response = await axiosInstance.get("/activity-log", {
        params: {
          cursor,
          limit,
        },
      });
      return response.data;
    },
  });
};

// Twillio Queries
export const useGetSessionMeetingUrl = (sessionId: string) => {
  return useQuery({
    queryKey: ["session-meeting-url", sessionId],
    queryFn: async (): Promise<APIGetResponse<string>> => {
      const response = await axiosInstance.get(
        `/twilio-video/url/${sessionId}`
      );
      return response.data;
    },
    enabled: !!sessionId,
  });
};

// Support Queries
export const useGetSupports = () => {
  return useQuery({
    queryKey: ["supports"],
    queryFn: async (): Promise<APIGetResponse<SupportTicket[]>> => {
      const response = await axiosInstance.get("/support");
      return response.data;
    },
  });
};

export const useGetSupportTicketById = (id: string) => {
  return useQuery({
    queryKey: ["support", id],
    queryFn: async (): Promise<APIGetResponse<SupportTicket>> => {
      const response = await axiosInstance.get(`/support/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Tutor Change Queries
export const useGetTutorChangeRequests = () => {
  return useQuery({
    queryKey: ["tutor-change-requests"],
    queryFn: async (): Promise<APIGetResponse<ChangeRequest[]>> => {
      const response = await axiosInstance.get("/tutor-change-request");
      return response.data;
    },
  });
};

export const useGetChangeRequestById = (id: string) => {
  return useQuery({
    queryKey: ["tutor-change-request", id],
    queryFn: async (): Promise<APIGetResponse<ChangeRequest>> => {
      const response = await axiosInstance.get(`/tutor-change-request/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
