import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";

export const handleErrorMessage = (error: unknown): void => {
  toast.error(getErrorMessage(error, "An error occurred"));
};
