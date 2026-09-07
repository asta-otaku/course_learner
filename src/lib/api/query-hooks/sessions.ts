import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  TutorDetails,
  Timeslot,
  SessionResponse,
  AdminSessionsResponse,
  APIGetResponse,
} from "../../types";

// Timeslot Queries
export const useGetTimeslots = () => {
  return useQuery({
    queryKey: ["timeslots"],
    queryFn: async (): Promise<APIGetResponse<Timeslot[]>> => {
      const response = await axiosInstance.get("/time-slots");
      return response.data;
    },
  });
};

export const useGetTimeSlotByDayOfWeek = (dayOfWeek: string) => {
  return useQuery({
    queryKey: ["timeslot", dayOfWeek],
    queryFn: async (): Promise<APIGetResponse<Timeslot[]>> => {
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
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      "sessions",
      options?.dayOfWeek,
      options?.status,
      options?.date,
      options?.page,
      options?.limit,
    ],
    queryFn: async (): Promise<APIGetResponse<AdminSessionsResponse>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

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
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      "my-sessions",
      options?.dayOfWeek,
      options?.status,
      options?.date,
      options?.page,
      options?.limit,
    ],
    queryFn: async (): Promise<APIGetResponse<SessionResponse[]>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/sessions/me?${queryString}` : "/sessions/me";

      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetBookedSessions = (
  childId: string,
  options?: {
    status?: string;
    date?: string;
    dayOfWeek?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: [
      "booked-sessions",
      childId,
      options?.status ?? "",
      options?.date ?? "",
      options?.dayOfWeek ?? "",
      options?.search ?? "",
      options?.page ?? "",
      options?.limit ?? "",
    ],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const params = new URLSearchParams();

      if (options?.status && options.status !== "all")
        params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.dayOfWeek && options.dayOfWeek !== "all")
        params.append("dayOfWeek", options.dayOfWeek);
      if (options?.search) params.append("search", options.search);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/sessions/booked/${childId}?${queryString}`
        : `/sessions/booked/${childId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
    enabled: !!childId,
  });
};

export const useGetAvailableSessions = (
  options?: {
    status?: string;
    date?: string;
    dayOfWeek?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: [
      "available-sessions",
      options?.status ?? "",
      options?.date ?? "",
      options?.dayOfWeek ?? "",
      options?.search ?? "",
      options?.page ?? "",
      options?.limit ?? "",
    ],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const params = new URLSearchParams();

      if (options?.status && options.status !== "all")
        params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.dayOfWeek && options.dayOfWeek !== "all")
        params.append("dayOfWeek", options.dayOfWeek);
      if (options?.search) params.append("search", options.search);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/sessions/available?${queryString}`
        : `/sessions/available`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

// Tutor Availability Queries
export const useGetTutorAvailability = () => {
  return useQuery({
    queryKey: ["tutor-availability"],
    queryFn: async (): Promise<APIGetResponse<TutorDetails>> => {
      const response = await axiosInstance.get("/tutor-availability");
      return response.data;
    },
  });
};
