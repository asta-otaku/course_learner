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
  SessionResponse,
  ConfirmSessionData,
  CancelSessionData,
  RescheduleSessionData,
  TutorDetails,
  Question,
  Quiz,
  QuizUpdateData,
  Lesson,
  Curriculum,
  QuizAttempt,
  SupportTicket,
  ChangeRequest,
  Homework,
  HomeworkReview,
  BaselinelineTestCreateData,
  BaselineTest,
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

export const usePostTrialSubscription = () => {
  return useMutation({
    mutationKey: ["post-trial-subscription"],
    mutationFn: (): Promise<ApiResponse<{ clientSecret: string }>> =>
      axiosInstance.post("/subscriptions/trial-setup"),
    onSuccess: (data: ApiResponse<{ clientSecret: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useValidateTrialSubscription = () => {
  return useMutation({
    mutationKey: ["validate-trial-subscription"],
    mutationFn: (data: {
      paymentMethodId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post("/subscriptions/validate-trial-card", data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
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

// Bulk Import Mutations
export const usePostValidate = (type: "csv" | "json") => {
  return useMutation({
    mutationKey: ["post-validate", type],
    mutationFn: (data: {
      file: File;
    }): Promise<ApiResponse<{ message: string }>> => {
      const formData = new FormData();
      formData.append("file", data.file);
      return axiosInstance.post(`/bulk-import/validate/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostBulkImport = (type: "csv" | "json") => {
  return useMutation({
    mutationKey: ["post-bulk-import", type],
    mutationFn: (data: {
      file: File;
      addToQuizId?: string;
      folderId?: string;
    }): Promise<ApiResponse<{ message: string }>> => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.addToQuizId) {
        formData.append("addToQuizId", data.addToQuizId);
      }
      if (data.folderId) {
        formData.append("folderId", data.folderId);
      }
      return axiosInstance.post(`/bulk-import/import/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Question Mutations
export const usePostQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-question"],
    mutationFn: (data: FormData): Promise<ApiResponse<Question>> =>
      axiosInstance.post("/questions", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (data: ApiResponse<Question>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutQuestion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-question", id],
    mutationFn: (data: FormData): Promise<ApiResponse<Question>> =>
      axiosInstance.put(`/questions/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (data: ApiResponse<Question>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuestion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-question", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/questions/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-questions"],
    mutationFn: (data: {
      ids: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete("/questions/bulk", { data }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question"],
      });
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["folder"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Folder Mutations
export const usePostFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-folder"],
    mutationFn: (data: {
      name: string;
      description: string;
      parentFolderId?: string;
    }): Promise<
      ApiResponse<{
        id: string;
        name: string;
        description: string;
        parentFolderId?: string;
        createdAt: string;
        updatedAt: string;
      }>
    > => axiosInstance.post("/folder", data),
    onSuccess: (
      data: ApiResponse<{
        id: string;
        name: string;
        description: string;
        parentFolderId?: string;
        createdAt: string;
        updatedAt: string;
      }>
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteFolder = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-folder", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/folder/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteFolderDynamic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-folder-dynamic"],
    mutationFn: (folderId: string): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/folder/${folderId}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchFolder = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-folder", id],
    mutationFn: (data: {
      name: string;
      description: string;
      parentFolderId?: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/folder/${id}`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutAddQuestionsToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-add-questions-to-folder"],
    mutationFn: (data: {
      questionIds: string[];
      targetFolderId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.put(`/folder/${data.targetFolderId}/questions`, {
        questionIds: data.questionIds,
      }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Quiz Mutations
export const usePostQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-quiz"],
    mutationFn: (data: Quiz): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post("/quizzes", data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quizzes-for-lesson"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutQuiz = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-quiz", id],
    mutationFn: (data: QuizUpdateData): Promise<ApiResponse<Quiz>> =>
      axiosInstance.put(`/quizzes/${id}`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-quiz"],
    mutationFn: (data: {
      quizIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/quizzes`, { data }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateQuizStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-update-quiz-status"],
    mutationFn: (data: {
      quizIds: string[];
      status: string;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(`/quizzes/status`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAddQuestionToQuiz = (id: string) => {
  return useMutation({
    mutationKey: ["post-add-question-to-quiz", id],
    mutationFn: (data: { questionId: string }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(`/quizzes/${id}/questions`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAttemptQuiz = (id: string) => {
  return useMutation({
    mutationKey: ["post-attempt-quiz", id],
    mutationFn: (data: {
      childId?: string;
    }): Promise<ApiResponse<QuizAttempt>> =>
      axiosInstance.post(`/quizzes/${id}/attempt`, data),
    onSuccess: (data: ApiResponse<QuizAttempt>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitQuiz = (id: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-quiz", id, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(`/quizzes/${id}/attempt/${attemptId}/submit`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};


export const usePostSubmitQuizQuestionDynamic = (id: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-quiz-question-dynamic", id, attemptId],
    mutationFn: ({
      questionId,
      answer,
    }: {
      questionId: string;
      answer: string;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(
        `/quizzes/${id}/attempt/${attemptId}/question/${questionId}/submit`,
        { answer }
      ),
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchAddQuizFeedback = (questionAttemptId: string) => {
  return useMutation({
    mutationKey: ["patch-add-quiz-feedback", questionAttemptId],
    mutationFn: (data: { feedback: string }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(
        `/quizzes/attempt/${questionAttemptId}/feedback`,
        data
      ),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Curriculum Mutations
export const usePostCurriculum = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-curriculum"],
    mutationFn: (data: Curriculum): Promise<ApiResponse<Curriculum>> =>
      axiosInstance.post("/curriculum", data),
    onSuccess: (data: ApiResponse<Curriculum>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-curriculum", id],
    mutationFn: (data: Curriculum): Promise<ApiResponse<Curriculum>> =>
      axiosInstance.put(`/curriculum/${id}`, data),
    onSuccess: (data: ApiResponse<Curriculum>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-curriculum", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/curriculum/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderCurriculum = (subscriptionPlanId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-curriculum", subscriptionPlanId],
    mutationFn: (data: {
      curriculumIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/curriculum/${subscriptionPlanId}/curricula`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDuplicateCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-duplicate-curriculum", id],
    mutationFn: (data: {
      subscriptionPlanId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post(`/curriculum/${id}/duplicate`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Lesson Mutations
export const usePostLesson = (curriculumId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-lesson", curriculumId],
    mutationFn: (data: Lesson): Promise<ApiResponse<Lesson>> =>
      axiosInstance.post(`/curriculum/${curriculumId}/lessons`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["curriculum", curriculumId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lesson"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutLesson = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-lesson", lessonId],
    mutationFn: (data: Lesson): Promise<ApiResponse<Lesson>> =>
      axiosInstance.put(`/lesson/${lessonId}`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", lessonId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchLessonQuizzes = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-lesson-quizzes", lessonId],
    mutationFn: (data: { quizIds: string[] }): Promise<ApiResponse<Lesson>> =>
      axiosInstance.patch(`/lesson/${lessonId}/quizzes`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["quizzes-for-lesson", lessonId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteLesson = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-lesson", lessonId],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/lesson/${lessonId}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderLessons = (curriculumId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-lessons", curriculumId],
    mutationFn: (data: {
      lessonIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/lesson/${curriculumId}/reorder`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", curriculumId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDuplicateLessonToCurriculum = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-duplicate-lesson-to-curriculum", lessonId],
    mutationFn: (data: {
      targetCurriculumId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post(`/lesson/${lessonId}/curriculum`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Uploader
export const usePostUploader = () => {
  return useMutation({
    mutationKey: ["post-uploader"],
    mutationFn: (data: {
      key: string;
      contentType: string;
    }): Promise<ApiResponse<{ fileKeyName: string; url: string }>> =>
      axiosInstance.post("/s3/pre-signed-url", data),
    onSuccess: (data: ApiResponse<{ fileKeyName: string; url: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

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

// Child Library Mutations
export const usePatchLessonProgress = (lessonId: string, childId: string) => {
  return useMutation({
    mutationKey: ["patch-lesson-progress", lessonId, childId],
    mutationFn: (data: {
      progress: number;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(
        `/library/${childId}/${lessonId}/progress/quiz`,
        data
      ),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchVideoLessonProgress = (
  lessonId: string,
  childId: string
) => {
  return useMutation({
    mutationKey: ["patch-video-lesson-progress", lessonId, childId],
    mutationFn: (data: {
      childId: string;
      watchedPosition: number;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(
        `/library/${childId}/${lessonId}/progress/video`,
        data
      ),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

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
    }): Promise<ApiResponse<ChangeRequest>> => {
      const url =
        data.status === "approved"
          ? `/tutor-change-request/${id}/approve`
          : `/tutor-change-request/${id}/reject`;
      return axiosInstance.patch(url, { reviewNote: data.reviewNote });
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

// Homework Mutations
export const usePostHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-homework"],
    mutationFn: (data: {
      studentId: string;
      quizId: string;
      dueAt: string;
    }): Promise<ApiResponse<Homework>> => axiosInstance.post("/homework", data),
    onSuccess: (data: ApiResponse<Homework>) => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostStartHomework = () => {
  return useMutation({
    mutationKey: ["post-start-homework"],
    mutationFn: (data: {
      homeworkId: string;
      studentId: string;
    }): Promise<ApiResponse<Homework>> =>
      axiosInstance.post("/homework/start", data),
    onSuccess: (data: ApiResponse<Homework>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitHomework = (id: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-homework", id, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<Homework>> =>
      axiosInstance.post(`/homework/${id}/attempt/${attemptId}/submit`, data),
    onSuccess: (data: ApiResponse<Homework>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchMarkHomeworkAsReviewed = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-mark-homework-as-reviewed", id],
    mutationFn: (): Promise<ApiResponse<Homework>> =>
      axiosInstance.patch(`/homework/${id}/review`, {}),
    onSuccess: (data: ApiResponse<Homework>) => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Baseline Test Mutations
export const usePostBaselineTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-baseline-test"],
    mutationFn: (data: BaselinelineTestCreateData): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post("/baseline-test", data),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      queryClient.invalidateQueries({
        queryKey: ["baseline-tests"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostStartBaselineTest = (baselineTestId: string) => {
  return useMutation({
    mutationKey: ["post-start-baseline-test", baselineTestId],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post(`/baseline-test/${baselineTestId}/attempts/start`, data),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
}

export const usePostSubmitBaselineTest = (baselineTestId: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-baseline-test", baselineTestId, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post(`/baseline-test/${baselineTestId}/attempts/${attemptId}/submit`, data),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};