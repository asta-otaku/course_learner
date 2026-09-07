import { AxiosError } from "axios";

function messageFromAxiosData(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message) return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return undefined;
}

export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred",
): string {
  if (error instanceof AxiosError) {
    return messageFromAxiosData(error.response?.data) || error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AxiosError) return error.response?.status;
  return undefined;
}

export function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) return error.name;
  return undefined;
}
