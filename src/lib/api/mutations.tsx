import { useMutation } from "@tanstack/react-query";
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
} from "../types";

// Auth Mutations
export const usePostLogin = () => {
  return useMutation({
    mutationKey: ["post-login"],
    mutationFn: (data: LoginData): Promise<ApiResponse<AuthResponse>> =>
      axiosInstance.post("/auth/sign-in", data),
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePostSignUp = () => {
  return useMutation({
    mutationKey: ["post-sign-up"],
    mutationFn: (data: SignUpData): Promise<ApiResponse<AuthResponse>> =>
      axiosInstance.post("/auth/signup/parent", data),
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message[0] || "An error occurred");
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
          if (value !== undefined) {
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
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message[0] || "An error occurred");
    },
  });
};

export const usePostForgotPassword = () => {
  return useMutation({
    mutationKey: ["post-forgot-password"],
    mutationFn: (data: ForgotPasswordData): Promise<ApiResponse> =>
      axiosInstance.post("/auth/forgot-password", data),
    onSuccess: (data: ApiResponse) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePostResetPassword = () => {
  return useMutation({
    mutationKey: ["post-reset-password"],
    mutationFn: (data: ResetPasswordData): Promise<ApiResponse> =>
      axiosInstance.post("/auth/reset-password", data),
    onSuccess: (data: ApiResponse) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

// User Mutations
export const usePostChangePassword = () => {
  return useMutation({
    mutationKey: ["post-change-password"],
    mutationFn: (data: ChangePasswordData): Promise<ApiResponse> =>
      axiosInstance.patch("/users/change-password", data),
    onSuccess: (data: ApiResponse) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

// Child Profile Mutations
export const usePostChildProfiles = () => {
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
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePatchChildTutor = () => {
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
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
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
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

// Timeslot Mutations
export const usePostTimeslot = () => {
  return useMutation({
    mutationKey: ["post-timeslot"],
    mutationFn: (data: TimeslotCreateData): Promise<ApiResponse<Timeslot>> =>
      axiosInstance.post("/time-slots", data),
    onSuccess: (data: ApiResponse<Timeslot>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePostTimeslots = () => {
  return useMutation({
    mutationKey: ["post-timeslots"],
    mutationFn: (data: {
      timeSlots: TimeslotCreateData[];
    }): Promise<ApiResponse<Timeslot[]>> =>
      axiosInstance.post("/time-slots/multiple", data),
    onSuccess: (data: ApiResponse<Timeslot[]>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePatchTimeslot = () => {
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
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const useDeleteTimeslot = () => {
  return useMutation({
    mutationKey: ["delete-timeslot"],
    mutationFn: (data: { id: string }): Promise<ApiResponse<Timeslot>> =>
      axiosInstance.delete(`/time-slots/${data.id}`),
    onSuccess: (data: ApiResponse<Timeslot>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

// Sessions Mutations
export const usePostBookSession = () => {
  return useMutation({
    mutationKey: ["post-book-session"],
    mutationFn: (
      data: BookSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.post(`/sessions/${data.childProfileId}/book`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePutConfirmSession = (id: number) => {
  return useMutation({
    mutationKey: ["put-confirm-session"],
    mutationFn: (
      data: ConfirmSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/confirm`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePutCancelSession = (id: number) => {
  return useMutation({
    mutationKey: ["put-cancel-session"],
    mutationFn: (
      data: CancelSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/cancel`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePutRescheduleSession = (id: number) => {
  return useMutation({
    mutationKey: ["put-reschedule-session"],
    mutationFn: (
      data: RescheduleSessionData
    ): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/reschedule`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};

export const usePutCompleteSession = (id: number) => {
  return useMutation({
    mutationKey: ["put-complete-session"],
    mutationFn: (data: {
      sessionNotes: string;
    }): Promise<ApiResponse<SessionResponse>> =>
      axiosInstance.put(`/sessions/${id}/complete`, data),
    onSuccess: (data: ApiResponse<SessionResponse>) => {
      toast.success(data.message);
    },
    onError: (error: AxiosError) => {
      //@ts-ignore
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });
};
