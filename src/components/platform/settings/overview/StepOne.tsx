"use client";

import BackArrow from "@/assets/svgs/arrowback";
import React, { useState } from "react";
import { usePostChangePassword } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/schema";
import { z } from "zod";
import { Eye, EyeOff, Loader } from "lucide-react";

function StepOne({ setStep }: { setStep: (step: number) => void }) {
  const { mutateAsync: changePassword, isPending } = usePostChangePassword();
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const toggleOldPasswordVisibility = () => setOldPasswordVisible((v) => !v);
  const toggleNewPasswordVisibility = () => setNewPasswordVisible((v) => !v);
  const toggleConfirmPasswordVisibility = () =>
    setConfirmPasswordVisible((v) => !v);

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    const res = await changePassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmNewPassword,
    });
    if (res.status === 200) {
      toast.success(res.data.message);
    }
  };

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-start gap-12 w-full mb-6">
        <div
          className="self-start text-sm cursor-pointer"
          onClick={() => setStep(0)}
        >
          <BackArrow color="#808080" />
        </div>
        <div>
          <h1 className="text-textGray font-semibold md:text-lg">
            Change Password
          </h1>
          <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
            Reset Password
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 max-w-2xl mx-auto w-full"
      >
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            Old Password
          </label>
          <div className="relative">
            <input
              {...register("oldPassword")}
              type={oldPasswordVisible ? "text" : "password"}
              placeholder="Enter old password"
              className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400 pr-12"
            />
            <span
              onClick={toggleOldPasswordVisibility}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer"
            >
              {oldPasswordVisible ? (
                <Eye color="#6B7280" className="w-4 h-4" />
              ) : (
                <EyeOff color="#6B7280" className="w-4 h-4" />
              )}
            </span>
          </div>
          {errors.oldPassword && (
            <span className="text-red-500 text-xs">
              {errors.oldPassword.message}
            </span>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              {...register("newPassword")}
              type={newPasswordVisible ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400 pr-12"
            />
            <span
              onClick={toggleNewPasswordVisibility}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer"
            >
              {newPasswordVisible ? (
                <Eye color="#6B7280" className="w-4 h-4" />
              ) : (
                <EyeOff color="#6B7280" className="w-4 h-4" />
              )}
            </span>
          </div>
          {errors.newPassword && (
            <span className="text-red-500 text-xs">
              {errors.newPassword.message}
            </span>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              {...register("confirmNewPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm new password"
              className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400 pr-12"
            />
            <span
              onClick={toggleConfirmPasswordVisibility}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer"
            >
              {confirmPasswordVisible ? (
                <Eye color="#6B7280" className="w-4 h-4" />
              ) : (
                <EyeOff color="#6B7280" className="w-4 h-4" />
              )}
            </span>
          </div>
          {errors.confirmNewPassword && (
            <span className="text-red-500 text-xs">
              {errors.confirmNewPassword.message}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white font-medium text-sm py-3 rounded-full mt-4 w-full flex items-center justify-center gap-2"
        >
          {isPending ? <Loader className="w-4 h-4 animate-spin" /> : "Confirm"}
        </button>
      </form>
    </div>
  );
}

export default StepOne;
