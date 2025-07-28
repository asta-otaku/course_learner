import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../services/axiosInstance";
import {
  ApiResponse,
  SubscriptionPlan,
  ManageSubscriptionResponse,
  ChildProfile,
  DetailedChildProfile,
  TutorDetails,
  Timeslot,
  SessionResponse,
} from "../types";

// User Queries
export const useGetUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<ApiResponse<TutorDetails[]>> => {
      const response = await axiosInstance.get("/users");
      return response.data;
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get("/users/profile");
      return response.data;
    },
  });
};

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
    },
  });
};

// Subscription Queries
export const useGetSubscriptionPlans = (id?: string) => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async (): Promise<ApiResponse<SubscriptionPlan>> => {
      const url = id ? "/subscriptions/user-subscription" : "/subscriptions";
      const response = await axiosInstance.get(url, {
        params: { parentId: id },
      });
      return response.data;
    },
  });
};

export const useGetManageSubscription = () => {
  return useQuery({
    queryKey: ["manage-subscription"],
    queryFn: async (): Promise<ApiResponse<ManageSubscriptionResponse>> => {
      const response = await axiosInstance.get(
        "/subscriptions/manage-subscription"
      );
      return response.data;
    },
  });
};

// Child Profile Queries
export const useGetChildProfile = () => {
  return useQuery({
    queryKey: ["child-profiles"],
    queryFn: async (): Promise<ApiResponse<ChildProfile[]>> => {
      const response = await axiosInstance.get("/child-profiles");
      return response.data;
    },
  });
};

export const useGetChildProfileById = (id: string) => {
  return useQuery({
    queryKey: ["child-profile", id],
    queryFn: async (): Promise<ApiResponse<DetailedChildProfile>> => {
      const response = await axiosInstance.get(`/child-profiles/${id}`);
      return response.data;
    },
  });
};

export const useGetChildTutor = (id: string) => {
  return useQuery({
    queryKey: ["child-tutor", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/child-profiles/${id}/tutor`);
      return response.data;
    },
  });
};

// Tutor Queries
export const useGetTutors = () => {
  return useQuery({
    queryKey: ["tutors"],
    queryFn: async (): Promise<ApiResponse<TutorDetails[]>> => {
      const response = await axiosInstance.get("/tutors");
      return response.data;
    },
  });
};

export const useGetTutorById = (id: string) => {
  return useQuery({
    queryKey: ["tutor", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/tutors/${id}`);
      return response.data;
    },
  });
};

export const useGetTutorStudent = (id: string) => {
  return useQuery({
    queryKey: ["tutor-student", id],
    queryFn: async (): Promise<ChildProfile[]> => {
      const response = await axiosInstance.get(
        `/tutors/${id}/assigned-students`
      );
      return response.data;
    },
  });
};

// Timeslot Queries
export const useGetTimeslots = () => {
  return useQuery({
    queryKey: ["timeslots"],
    queryFn: async (): Promise<ApiResponse<Timeslot[]>> => {
      const response = await axiosInstance.get("/time-slots");
      return response.data;
    },
  });
};

export const useGetTimeSlotByDayOfWeek = (dayOfWeek: string) => {
  return useQuery({
    queryKey: ["timeslot", dayOfWeek],
    queryFn: async (): Promise<ApiResponse<Timeslot[]>> => {
      const response = await axiosInstance.get(`/time-slots/day/${dayOfWeek}`);
      return response.data;
    },
  });
};

// Session Queries
export const useGetSessions = (options?: {
  dayOfWeek?: string;
  status?: string;
  date?: string;
}) => {
  return useQuery({
    queryKey: ["sessions", options?.dayOfWeek, options?.status, options?.date],
    queryFn: async (): Promise<ApiResponse<SessionResponse[]>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);

      const queryString = params.toString();
      const url = queryString ? `/sessions?${queryString}` : "/sessions";

      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetMySessions = (options?: {
  dayOfWeek?: string;
  status?: string;
  date?: string;
}) => {
  return useQuery({
    queryKey: [
      "my-sessions",
      options?.dayOfWeek,
      options?.status,
      options?.date,
    ],
    queryFn: async (): Promise<ApiResponse<SessionResponse[]>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);

      const queryString = params.toString();
      const url = queryString ? `/sessions/me?${queryString}` : "/sessions/me";

      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetBookedSessions = (childId?: string) => {
  return useQuery({
    queryKey: ["booked-sessions", childId],
    queryFn: async (): Promise<ApiResponse<SessionResponse[]>> => {
      const url = childId
        ? `/sessions/booked?childId=${childId}`
        : "/sessions/booked";
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetAvailableSessions = (childId?: string) => {
  return useQuery({
    queryKey: ["available-sessions", childId],
    queryFn: async (): Promise<ApiResponse<SessionResponse[]>> => {
      const url = childId
        ? `/sessions/available?childId=${childId}`
        : "/sessions/available";
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};
