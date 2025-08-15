import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../services/axiosInstance";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  ApiResponse,
  SignUpData,
  LoginData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  CreateChildProfileData,
  DetailedChildProfile,
  CreateSubscriptionData,
  ManageSubscriptionResponse,
  TutorSignUpData,
  TimeslotCreateData,
  Timeslot,
  BookSessionData,
  SessionResponse,
  ConfirmSessionData,
  CancelSessionData,
  RescheduleSessionData,
  TutorDetails,
} from "../types";

// Helper function to handle error messages
const handleErrorMessage = (error: AxiosError): void => {
  const message = (error.response?.data as any)?.message;

  if (Array.isArray(message)) {
    toast.error(message[0] || "An error occurred");
  } else if (typeof message === "string") {
    toast.error(message);
  } else {
    toast.error("An error occurred");
  }
};

// Auth Mutations
export const usePostLogin = () => {
  return useMutation({
    mutationKey: ["post-login"],
    mutationFn: (data: LoginData): Promise<ApiResponse<AuthResponse>> =>
      axiosInstance.post("/auth/sign-in", data),
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSignUp = () => {
  return useMutation({
    mutationKey: ["post-sign-up"],
    mutationFn: (data: SignUpData): Promise<ApiResponse<AuthResponse>> =>
      axiosInstance.post("/auth/signup/parent", data),
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostTutorSignUp = (isAdmin?: boolean) => {
  return useMutation({
    mutationKey: ["post-tutor-sign-up"],
    mutationFn: (data: TutorSignUpData): Promise<ApiResponse<AuthResponse>> => {
      if (isAdmin) {
        return axiosInstance.post("/auth/signup/admin", data);
      } else {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (
            value !== undefined &&
            key !== "confirmPassword" &&
            key !== "howDidYouHearAboutUs" &&
            key !== "referralCode"
          ) {
            formData.append(key, value);
          }
        });
        return axiosInstance.post("/auth/signup/tutor", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
    },
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostForgotPassword = () => {
  return useMutation({
    mutationKey: ["post-forgot-password"],
    mutationFn: (
      data: ForgotPasswordData
    ): Promise<
      ApiResponse<{
        message: string;
      }>
    > => axiosInstance.post("/auth/forgot-password", data),
    onSuccess: (
      data: ApiResponse<{
        message: string;
      }>
    ) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostResetPassword = () => {
  return useMutation({
    mutationKey: ["post-reset-password"],
    mutationFn: (data: ResetPasswordData): Promise<ApiResponse> =>
      axiosInstance.post("/auth/reset-password", data),
    onSuccess: (data: ApiResponse) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// User Mutations
export const usePostChangePassword = () => {
  return useMutation({
    mutationKey: ["post-change-password"],
    mutationFn: (
      data: ChangePasswordData
    ): Promise<
      ApiResponse<{
        status: string;
        message: string;
      }>
    > => axiosInstance.patch("/users/change-password", data),
    onSuccess: (
      data: ApiResponse<{
        status: string;
        message: string;
      }>
    ) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-user"],
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      avatar?: File;
      phoneNumber: string;
    }): Promise<ApiResponse> => {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }
      formData.append("phoneNumber", data.phoneNumber);
      return axiosInstance.patch("/users/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse) => {
      queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Child Profile Mutations
export const usePostChildProfiles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-child-profiles"],
    mutationFn: (
      data: CreateChildProfileData
    ): Promise<ApiResponse<DetailedChildProfile>> => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("year", data.year);
      formData.append("avatar", data.avatar);
      return axiosInstance.post("/child-profiles/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<DetailedChildProfile>) => {
      queryClient.invalidateQueries({
        queryKey: ["child-profiles"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateChildProfile = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-update-child-profile", id],
    mutationFn: (data: {
      name: string;
      year: string;
      avatar?: File;
    }): Promise<ApiResponse<DetailedChildProfile>> => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("year", data.year);
      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }
      return axiosInstance.patch(`/child-profiles/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<DetailedChildProfile>) => {
      queryClient.invalidateQueries({
        queryKey: ["child-profiles"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchChildProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-child-profile"],
    mutationFn: (data: {
      id: string;
      deactivate?: boolean;
    }): Promise<ApiResponse<DetailedChildProfile>> => {
      const url = data.deactivate
        ? `/child-profiles/${data.id}/deactivate`
        : `/child-profiles/${data.id}/restore`;
      return axiosInstance.patch(url);
    },
    onSuccess: (data: ApiResponse<DetailedChildProfile>) => {
      queryClient.invalidateQueries({
        queryKey: ["child-profiles"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchChildTutor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-child-tutor"],
    mutationFn: (data: {
      childProfileId: string;
      tutorId: string;
    }): Promise<ApiResponse<DetailedChildProfile>> =>
      axiosInstance.patch(
        `/child-profiles/${data.childProfileId}/tutor/${data.tutorId}/assign`
      ),
    onSuccess: (data: ApiResponse<DetailedChildProfile>) => {
      queryClient.invalidateQueries({
        queryKey: ["all-parents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutors"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Subscription Mutations
export const usePostSubscription = () => {
  return useMutation({
    mutationKey: ["post-subscription"],
    mutationFn: (
      data: CreateSubscriptionData
    ): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.post("/subscriptions", data),
    onSuccess: (data: ApiResponse<ManageSubscriptionResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

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
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutConfirmSession = (id: string) => {
  return useMutation({
    mutationKey: ["put-confirm-session"],
    mutationFn: (
      data: ConfirmSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/confirm`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCancelSession = (id: string) => {
  return useMutation({
    mutationKey: ["put-cancel-session"],
    mutationFn: (
      data: CancelSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/cancel`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutRescheduleSession = (id: string) => {
  return useMutation({
    mutationKey: ["put-reschedule-session"],
    mutationFn: (
      data: RescheduleSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/reschedule`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCompleteSession = (id: string) => {
  return useMutation({
    mutationKey: ["put-complete-session"],
    mutationFn: (data: {
      sessionNotes: string;
    }): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/complete`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
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
      startToday: boolean;
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
      startToday: boolean;
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
