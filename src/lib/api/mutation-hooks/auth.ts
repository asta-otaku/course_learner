import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import {
  ApiResponse,
  SignUpData,
  LoginData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  TutorSignUpData,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Auth Mutations
export const usePostLogin = () => {
  return useMutation({
    mutationKey: ["post-login"],
    mutationFn: (data: LoginData): Promise<ApiResponse<AuthResponse>> =>
      axiosInstance.post("/auth/sign-in", data, { skipAuthRedirect: true }),
    onSuccess: (data: ApiResponse<AuthResponse>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      // @ts-expect-error -- existing ignore
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
      data: ForgotPasswordData,
    ): Promise<
      ApiResponse<{
        message: string;
      }>
    > => axiosInstance.post("/auth/forgot-password", data),
    onSuccess: (
      data: ApiResponse<{
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

