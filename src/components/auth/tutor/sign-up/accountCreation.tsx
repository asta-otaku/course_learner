"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, PlusCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tutorAccountCreationSchema } from "@/lib/schema";
import { z } from "zod";

export interface AccountCreationProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  isAdmin?: boolean;
}

export default function AccountCreation({
  currentStep,
  setCurrentStep,
  isAdmin,
}: AccountCreationProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof tutorAccountCreationSchema>>({
    resolver: zodResolver(tutorAccountCreationSchema),
    defaultValues: {
      avatar: null,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      howDidYouHearAboutUs: "",
      referralCode: "",
    },
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { push } = useRouter();

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setValue("avatar", e.target.files[0]);
    }
  };

  const toggleVisibility = () => setPasswordVisible((v) => !v);

  const onSubmit = (data: z.infer<typeof tutorAccountCreationSchema>) => {
    if (isAdmin) {
      push("/admin/sign-in");
    } else {
      setCurrentStep(1);
    }
  };

  return (
    <>
      {!isAdmin ? (
        <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
          step {currentStep + 1}/2
        </h5>
      ) : null}
      <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
        SET UP YOUR ACCOUNT
      </h2>
      <p className="text-textSubtitle font-medium mb-2">
        Enter your details correctly
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid="signup-form"
        className="max-w-md w-full mx-auto flex flex-col gap-2"
      >
        {/* Avatar picker */}
        <div className="flex justify-center my-12">
          <label
            htmlFor="avatar-upload"
            className="relative cursor-pointer rounded-2xl bg-[#E9E9E9] p-0 flex flex-col items-center justify-center avatar-dashed"
            style={{ width: 222, height: 191 }}
          >
            {watch("avatar") ? (
              <div className="relative w-full h-full">
                <img
                  src={URL.createObjectURL(watch("avatar") as File)}
                  alt="Avatar preview"
                  className="object-cover rounded-lg w-full h-full"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setValue("avatar", null);
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <>
                <PlusCircle className="text-[#6B7280]" />
                <div className="text-sm text-[#6B7280] mt-2">Choose Avatar</div>
              </>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </label>
        </div>
        {errors.avatar && (
          <span className="text-red-500 text-xs">
            {errors.avatar.message as string}
          </span>
        )}
        {/** First Name */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">First Name</label>
          <Input
            {...register("firstName")}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="John"
          />
          {errors.firstName && (
            <span className="text-red-500 text-xs">
              {errors.firstName.message}
            </span>
          )}
        </div>

        {/** Last Name */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Last Name</label>
          <Input
            {...register("lastName")}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Doe"
          />
          {errors.lastName && (
            <span className="text-red-500 text-xs">
              {errors.lastName.message}
            </span>
          )}
        </div>

        {/** Email */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Email Address</label>
          <Input
            {...register("email")}
            type="email"
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="johndoe@example.com"
          />
          {errors.email && (
            <span className="text-red-500 text-xs">{errors.email.message}</span>
          )}
        </div>

        {/** Phone */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Phone Number</label>
          <Input
            {...register("phone")}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Type Number"
          />
          {errors.phone && (
            <span className="text-red-500 text-xs">{errors.phone.message}</span>
          )}
        </div>

        {/** Password */}
        <div className="relative flex flex-col gap-1">
          <label className="font-medium">Password</label>
          <Input
            {...register("password")}
            type={passwordVisible ? "text" : "password"}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Enter Password"
          />
          <span
            onClick={toggleVisibility}
            className="absolute top-9 right-4 cursor-pointer"
          >
            {passwordVisible ? (
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

        {/** Confirm Password */}
        <div className="relative flex flex-col gap-1">
          <label className="font-medium">Confirm Password</label>
          <Input
            {...register("confirmPassword")}
            type={passwordVisible ? "text" : "password"}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Enter Password"
          />
          <span
            onClick={toggleVisibility}
            className="absolute top-9 right-4 cursor-pointer"
          >
            {passwordVisible ? (
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
          className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        >
          Next
        </Button>
      </form>
    </>
  );
}
