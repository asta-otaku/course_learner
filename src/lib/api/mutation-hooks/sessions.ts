import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
  TimeslotCreateData,
  Timeslot,
  SessionResponse,
  ConfirmSessionData,
  CancelSessionData,
  RescheduleSessionData,
  TutorDetails,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Timeslot Mutations
export const usePostTimeslot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-timeslot"],
    mutationFn: (data: TimeslotCreateData): Promise<ApiResponse<Timeslot>> =>
      axiosInstance.post("/time-slots", data),
    onSuccess: (data: ApiResponse<Timeslot>) => {
      queryClient.invalidateQueries({
        queryKey: ["timeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["timeslot"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostTimeslots = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-timeslots"],
    mutationFn: (data: {
      timeSlots: TimeslotCreateData[];
    }): Promise<ApiResponse<Timeslot[]>> =>
      axiosInstance.post("/time-slots/multiple", data),
    onSuccess: (data: ApiResponse<Timeslot[]>) => {
      queryClient.invalidateQueries({
        queryKey: ["timeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["timeslot"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchTimeslot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-timeslot"],
    mutationFn: (data: {
      id: string;
      activate?: boolean;
    }): Promise<ApiResponse<Timeslot>> => {
      const url = data.activate
        ? `/time-slots/${data.id}/activate`
        : `/time-slots/${data.id}/deactivate`;
      return axiosInstance.patch(url);
    },
    onSuccess: (data: ApiResponse<Timeslot>) => {
      queryClient.invalidateQueries({
        queryKey: ["timeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["timeslot"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutTimeslot = (deactivate?: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-timeslot"],
    mutationFn: (data: {
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      chunkSizeMinutes: number;
    }): Promise<ApiResponse<Timeslot>> => {
      const url = deactivate
        ? `/time-slots/${data.id}/deactivate`
        : `/time-slots/${data.id}/activate`;
      return axiosInstance.patch(url, data);
    },
    onSuccess: (data: ApiResponse<Timeslot>) => {
      queryClient.invalidateQueries({
        queryKey: ["timeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["timeslot"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteTimeslot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-timeslot"],
    mutationFn: (data: { id: string }): Promise<ApiResponse<Timeslot>> =>
      axiosInstance.delete(`/time-slots/${data.id}`),
    onSuccess: (data: ApiResponse<Timeslot>) => {
      queryClient.invalidateQueries({
        queryKey: ["timeslots"],
      });
      queryClient.invalidateQueries({
        queryKey: ["timeslot"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Sessions Mutations
export const usePostBookSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-book-session"],
    mutationFn: async (data: {
      sessionId: string;
      childProfileId: string;
      notes: string;
    }): Promise<ApiResponse<SessionResponse>> => {
      const { sessionId, ...payload } = data;
      return axiosInstance.post(`/sessions/${sessionId}/book`, payload);
    },
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      queryClient.invalidateQueries({ queryKey: ["booked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-sessions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutConfirmSession = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-confirm-session"],
    mutationFn: (
      data: ConfirmSessionData,
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/confirm`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      queryClient.invalidateQueries({ queryKey: ["booked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-sessions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCancelSession = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-cancel-session"],
    mutationFn: (
      data: CancelSessionData,
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/cancel`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      queryClient.invalidateQueries({ queryKey: ["booked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-sessions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutRescheduleSession = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-reschedule-session"],
    mutationFn: (
      data: RescheduleSessionData,
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/reschedule`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      queryClient.invalidateQueries({ queryKey: ["booked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-sessions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCompleteSession = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-complete-session"],
    mutationFn: (data: {
      sessionNotes: string;
    }): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/complete`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      queryClient.invalidateQueries({ queryKey: ["booked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-sessions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Tutor Availability Mutations
export const usePostTutorAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-tutor-availability"],
    mutationFn: (data: {
      timeSlotIds: string[];
    }): Promise<ApiResponse<TutorDetails>> =>
      axiosInstance.post("/tutor-availability/select-time-slots", data),
    onSuccess: (data: ApiResponse<TutorDetails>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-availability"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDeleteTutorAvailability = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-delete-tutor-availability"],
    mutationFn: (data: {
      timeSlotIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/tutor-availability/${id}/slots`, { data }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["tutor-availability", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

