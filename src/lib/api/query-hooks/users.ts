import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  ApiResponse,
  ChildProfile,
  TutorDetails,
  APIGetResponse,
  ParentDetails,
} from "../../types";

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
    queryFn: async (): Promise<APIGetResponse<TutorDetails>> => {
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

// Child Profile Queries
export const useGetChildProfile = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["child-profiles"],
    queryFn: async (): Promise<APIGetResponse<ChildProfile[]>> => {
      const response = await axiosInstance.get("/child-profiles");
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
};

export const useGetChildProfileById = (id: string) => {
  return useQuery({
    queryKey: ["child-profile", id],
    queryFn: async (): Promise<APIGetResponse<ChildProfile>> => {
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
    queryFn: async (): Promise<APIGetResponse<TutorDetails[]>> => {
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

export const useGetTutorStudent = (
  id?: string,
  status?: "pending" | "active" | "not-active",
) => {
  return useQuery({
    queryKey: ["tutor-student", id ?? null, status ?? null],
    queryFn: async (): Promise<ChildProfile[]> => {
      const params = new URLSearchParams();
      if (id) params.append("tutorId", id);
      if (status) params.append("status", status);
      const response = await axiosInstance.get(
        `/tutors/assigned-students?${params.toString()}`
      );
      return response.data.data;
    },
  });
};

// Parent Queries
export const useGetAllParents = () => {
  return useQuery({
    queryKey: ["all-parents"],
    queryFn: async (): Promise<APIGetResponse<ParentDetails[]>> => {
      const response = await axiosInstance.get("/parents");
      return response.data;
    },
  });
};
