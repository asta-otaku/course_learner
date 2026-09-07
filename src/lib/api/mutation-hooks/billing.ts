import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
  CreateSubscriptionData,
  ManageSubscriptionResponse,
  UpgradeToTuitionPreviewResponse,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Subscription Mutations
export const useDeleteCancelSubscriptions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-cancel-subscriptions"],
    mutationFn: (): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.delete("/subscriptions"),
    onSuccess: (data: ApiResponse<ManageSubscriptionResponse>) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["manage-subscription"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubscriptionCheckout = () => {
  return useMutation({
    mutationKey: ["post-subscription-checkout"],
    mutationFn: (
      data: CreateSubscriptionData,
    ): Promise<ApiResponse<{ url: string }>> =>
      axiosInstance.post("/subscriptions/checkout", data),
    onSuccess: (data: ApiResponse<{ url: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubscriptionBillingPortal = () => {
  return useMutation({
    mutationKey: ["post-subscription-billing-portal"],
    mutationFn: (): Promise<ApiResponse<{ url: string }>> =>
      axiosInstance.post("/subscriptions/billing-portal", {}),
    onSuccess: (data: ApiResponse<{ url: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostTuitionSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-tuition-subscription"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.post("/subscriptions/tuition", data),
    onSuccess: (data: ApiResponse<ManageSubscriptionResponse>) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["manage-subscription"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAddTuitionPreview = () => {
  return useMutation({
    mutationKey: ["post-add-tuition-preview"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<UpgradeToTuitionPreviewResponse>> =>
      axiosInstance.post("/subscriptions/tuition/preview", {
        childProfileId: data.childProfileId,
      }),
    onSuccess: (data: ApiResponse<UpgradeToTuitionPreviewResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteTuitionSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-tuition-subscription"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.delete("/subscriptions/tuition", {
        data: {
          childProfileId: data.childProfileId,
        },
      }),
    onSuccess: (data: ApiResponse<ManageSubscriptionResponse>) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["manage-subscription"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDeleteTuitionPreview = () => {
  return useMutation({
    mutationKey: ["post-delete-tuition-preview"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<UpgradeToTuitionPreviewResponse>> =>
      axiosInstance.post("/subscriptions/tuition/remove-preview", {
        childProfileId: data.childProfileId,
      }),
    onSuccess: (data: ApiResponse<UpgradeToTuitionPreviewResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostUpgradeToTuition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-upgrade-to-tuition"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.post("/subscriptions/upgrade-to-tuition", data),
    onSuccess: (data: ApiResponse<ManageSubscriptionResponse>) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["manage-subscription"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostUpgradeToTuitionPreview = () => {
  return useMutation({
    mutationKey: ["post-upgrade-to-tuition-preview"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<UpgradeToTuitionPreviewResponse>> =>
      axiosInstance.post("/subscriptions/upgrade-to-tuition/preview", {
        childProfileId: data.childProfileId,
      }),
    onSuccess: (data: ApiResponse<UpgradeToTuitionPreviewResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// ── Platform seat mutations ──────────────────────────────────────────────────

export const usePostPlatformSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-platform-subscription"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.post("/subscriptions/platform", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["manage-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["child-profiles"] });
    },
    onError: (error: AxiosError) => handleErrorMessage(error),
  });
};

export const useDeletePlatformSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-platform-subscription"],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<ManageSubscriptionResponse>> =>
      axiosInstance.delete("/subscriptions/platform", { data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["manage-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["child-profiles"] });
    },
    onError: (error: AxiosError) => handleErrorMessage(error),
  });
};


