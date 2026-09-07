import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";
import { isChildProfileBlockedByCancelledSubscription } from "../../childProfileCreation";
import {
  APIGetResponse,
  ApiResponse,
  ChangePasswordData,
  ChildProfile,
  CreateChildProfileData,
  DetailedChildProfile,
  ChildPreferences,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// User Mutations
export const usePostChangePassword = () => {
  return useMutation({
    mutationKey: ["post-change-password"],
    mutationFn: (
      data: ChangePasswordData,
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
      }>,
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
      data: CreateChildProfileData,
    ): Promise<ApiResponse<DetailedChildProfile>> => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("year", data.year);
      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }
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
      if (isChildProfileBlockedByCancelledSubscription(error)) return;
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

export const usePatchChildPofilePreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-child-profile-preference"],
    mutationFn: (data: {
      childProfileId: string;
      selectedCurriculumId: string;
    }): Promise<ApiResponse<ChildPreferences>> =>
      axiosInstance.patch(
        `/child-profiles/${data.childProfileId}/preferences`,
        {
          selectedCurriculumId: data.selectedCurriculumId,
        },
      ),
    onSuccess: (_response, variables) => {
      queryClient.setQueryData<APIGetResponse<ChildProfile[]>>(
        ["child-profiles"],
        (old) => {
          if (!old?.data || !Array.isArray(old.data)) return old;
          return {
            ...old,
            data: old.data.map((p: ChildProfile) =>
              String(p.id) === String(variables.childProfileId)
                ? {
                  ...p,
                  preferences: {
                    ...(p.preferences ?? {}),
                    selectedCurriculumId: variables.selectedCurriculumId,
                  },
                }
                : p,
            ),
          };
        },
      );
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
        `/child-profiles/${data.childProfileId}/tutor/${data.tutorId}/assign`,
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

