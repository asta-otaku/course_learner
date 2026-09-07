import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
  SupportTicket,
  ChangeRequest,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Twillio Mutations
export const usePostTwilioAccessToken = () => {
  return useMutation({
    mutationKey: ["post-twilio-access-token"],
    mutationFn: (data: {
      roomName: string;
    }): Promise<ApiResponse<{ token: string }>> =>
      axiosInstance.post(`/twilio-video`, data),
    onSuccess: (data: ApiResponse<{ token: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Support Mutations
export const usePostSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-support-ticket"],
    mutationFn: (data: {
      title: string;
      description: string;
      media?: File;
    }): Promise<ApiResponse<SupportTicket>> => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      if (data.media) {
        formData.append("media", data.media);
      }
      return axiosInstance.post("/support", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<SupportTicket>) => {
      queryClient.invalidateQueries({
        queryKey: ["supports"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateSupportTicketStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-update-support-ticket-status", id],
    mutationFn: (data: {
      status: "open" | "closed";
    }): Promise<ApiResponse<SupportTicket>> =>
      axiosInstance.patch(`/support/${id}`, data),
    onSuccess: (data: ApiResponse<SupportTicket>) => {
      queryClient.invalidateQueries({
        queryKey: ["supports"],
      });
      queryClient.invalidateQueries({
        queryKey: ["support", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSupportMessages = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-support-messages", id],
    mutationFn: (data: {
      message: string;
    }): Promise<ApiResponse<SupportTicket>> =>
      axiosInstance.post(`/support/${id}/messages`, data),
    onSuccess: (data: ApiResponse<SupportTicket>) => {
      queryClient.invalidateQueries({
        queryKey: ["support", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Tutor Change Mutations
export const usePostTutorChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-tutor-change-request"],
    mutationFn: (data: {
      childProfileId: string;
      currentTutorId: string;
      currentTutorName: string;
      requestedTutorId: string | null;
      requestedTutorName: string | null;
      reason: string | null;
    }): Promise<ApiResponse<ChangeRequest>> =>
      axiosInstance.post("/tutor-change-request", data),
    onSuccess: (data: ApiResponse<ChangeRequest>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-change-requests"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateTutorChangeRequest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-update-tutor-change-request", id],
    mutationFn: (data: {
      status: "pending" | "approved" | "rejected";
      reviewNote: string;
      assignedTutorId?: string;
      assignedTutorName?: string;
    }): Promise<ApiResponse<ChangeRequest>> => {
      const url =
        data.status === "approved"
          ? `/tutor-change-request/${id}/approve`
          : `/tutor-change-request/${id}/reject`;
      const body =
        data.status === "approved"
          ? {
            reviewNote: data.reviewNote,
            assignedTutorId: data.assignedTutorId ?? "",
            assignedTutorName: data.assignedTutorName ?? "",
          }
          : { reviewNote: data.reviewNote };
      return axiosInstance.patch(url, body);
    },
    onSuccess: (data: ApiResponse<ChangeRequest>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-change-requests"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

