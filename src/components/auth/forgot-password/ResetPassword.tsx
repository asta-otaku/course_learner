import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/schema";
import { z } from "zod";
import React, { useState } from "react";
import { usePostResetPassword } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export interface ResetPasswordProps {
  otp: string;
  email: string;
  redirectPath?: string;
}

export default function ResetPassword({
  otp,
  email,
  redirectPath = "/sign-in",
}: ResetPasswordProps) {
  const [passwordvisible, setPasswordVisible] = useState(false);
  const [confirmPasswordvisible, setConfirmPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { mutateAsync: postResetPassword, isPending: isResetPasswordPending } =
    usePostResetPassword();
  const { push } = useRouter();

  const toggleVisibility = () => setPasswordVisible((v) => !v);
  const confirmToggleVisibility = () => setConfirmPasswordVisible((v) => !v);
  return (
    <form
      className="max-w-xl w-full mx-auto flex flex-col gap-2"
      onSubmit={handleSubmit(async (data) => {
        const res = await postResetPassword({
          email,
          otpCode: otp,
          newPassword: data.password,
          confirmNewPassword: data.confirmPassword,
        });
        if (res.status === 200) {
          toast.success(res.data.message);
          push(redirectPath);
        }
      })}
    >
      <div className="relative flex flex-col gap-1">
        <label className="font-medium">Password</label>
        <Input
          {...register("password")}
          type={passwordvisible ? "text" : "password"}
          className="!rounded-xl !h-11 placeholder:text-textSubtitle"
          placeholder="Enter Password"
        />
        <span
          onClick={toggleVisibility}
          className="absolute top-9 right-4 cursor-pointer"
        >
          {passwordvisible ? (
            <Eye color="#141B34" className="w-5" />
          ) : (
            <EyeOff color="#141B34" className="w-5" />
          )}
        </span>
        {errors.password && (
          <span className="text-red-500 text-xs">
            {errors.password.message}
          </span>
        )}
      </div>
      <div className="relative flex flex-col gap-1">
        <label className="font-medium">Confirm Password</label>
        <Input
          {...register("confirmPassword")}
          type={confirmPasswordvisible ? "text" : "password"}
          className="!rounded-xl !h-11 placeholder:text-textSubtitle"
          placeholder="Enter Password"
        />
        <span
          onClick={confirmToggleVisibility}
          className="absolute top-9 right-4 cursor-pointer"
        >
          {confirmPasswordvisible ? (
            <Eye color="#141B34" className="w-5" />
          ) : (
            <EyeOff color="#141B34" className="w-5" />
          )}
        </span>
        {errors.confirmPassword && (
          <span className="text-red-500 text-xs">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>
      <Button
        type="submit"
        className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
      >
        Verify
      </Button>
    </form>
  );
}
