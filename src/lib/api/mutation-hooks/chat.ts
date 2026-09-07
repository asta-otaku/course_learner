import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Chat Mutations
export const usePostCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-create-chat"],
    mutationFn: (data: {
      tutorId: string;
      childId: string;
      tutorName: string;
      childName: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post("/chat/create", data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-chat-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-chat-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutChatById = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-chat-by-id", id],
    mutationFn: (data: {
      tutorName: string;
      childName: string;
      isArchived: boolean;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.put(`/chat/${id}`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-chat-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-chat-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteChatById = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-chat-by-id", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/chat/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-chat-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-chat-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Message Mutations
export const usePostMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-message"],
    mutationFn: (data: {
      chatId: string;
      senderId: string;
      content: string;
      senderName: string;
      media?: File;
    }): Promise<ApiResponse<{ message: string }>> => {
      if (data.media) {
        // Use multipart form data for media uploads
        const formData = new FormData();
        formData.append("chatId", data.chatId);
        formData.append("senderId", data.senderId);
        formData.append("content", data.content);
        formData.append("senderName", data.senderName);
        formData.append("media", data.media);

        return axiosInstance.post(`/message/media`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Use JSON for text-only messages
        return axiosInstance.post(`/message`, {
          chatId: data.chatId,
          senderId: data.senderId,
          content: data.content,
          senderName: data.senderName,
        });
      }
    },
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

