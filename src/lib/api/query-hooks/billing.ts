import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  ManageSubscriptionResponse,
  APIGetResponse,
  SubscriptionPlan,
  Subscription,
} from "../../types";

// Subscription Queries
export const useGetSubscriptions = (parentId?: string) => {
  return useQuery({
    queryKey: ["subscriptions", parentId],
    queryFn: async (): Promise<APIGetResponse<Subscription>> => {
      const response = await axiosInstance.get(`/subscriptions`, {
        params: { parentId },
      });
      return response.data;
    },
  });
}

export const useGetSubscriptionPlans = () => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async (): Promise<
      APIGetResponse<SubscriptionPlan[]>
    > => {
      const response = await axiosInstance.get("/subscriptions/plans");
      return response.data;
    },
  });
};

export const useGetSubscriptionPlansWithIds = () => {
  return useQuery({
    queryKey: ["subscription-plans-with-ids"],
    queryFn: async (): Promise<
      APIGetResponse<
        {
          id: string;
          offerType: string;
          stripePriceId: string;
          isActive: boolean;
        }[]
      >
    > => {
      const response = await axiosInstance.get("/subscriptions/plans");
      return response.data;
    },
  });
};

export const useGetManageSubscription = (parentId?: string) => {
  return useQuery({
    queryKey: ["manage-subscription", parentId],
    queryFn: async (): Promise<APIGetResponse<ManageSubscriptionResponse>> => {
      const response = await axiosInstance.get(
        "/subscriptions/manage",
        {
          params: { parentId },
        }
      );
      return response.data;
    },
  });
};
