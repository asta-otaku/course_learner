"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountCreationSchema } from "@/lib/schema";
import { z } from "zod";
import { usePostSignUp } from "@/lib/api/mutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountCreationProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}

type AccountCreationForm = z.infer<typeof accountCreationSchema>;

export default function AccountCreation({
  currentStep,
  setCurrentStep,
}: AccountCreationProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [successStep, setSuccessStep] = useState(false);
  const { mutate: postSignUp, isPending, isSuccess } = usePostSignUp();
  const [countryCode, setCountryCode] = useState("+44");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountCreationForm>({
    resolver: zodResolver(accountCreationSchema),
  });

  const toggleVisibility = () => setPasswordVisible((v) => !v);

  const onSubmit = (data: AccountCreationForm) => {
    const cleanedPhone = data.phoneNumber.replace(/^0+/, "");
    const fullPhoneNumber = `${countryCode}${cleanedPhone}`;
    postSignUp({ ...data, phoneNumber: fullPhoneNumber });
    if (isSuccess) {
      setSuccessStep(true);
    }
  };

  const handleNext = () => {
    setCurrentStep(1);
  };

  const countryCodes = [
    { code: "+44", label: "UK" },
    { code: "+1", label: "US" },
  ];

  return (
    <>
      <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
        step {currentStep + 1} out of 3
      </h5>
      <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
        {successStep ? "Account created successfully" : "SET UP YOUR ACCOUNT"}
      </h2>
      <p className="text-textSubtitle font-medium mb-2">
        {successStep ? "We are almost there" : "Enter your details correctly"}
      </p>

      {successStep ? (
        <div className="mt-6 text-center w-full max-w-md">
          <p className="max-w-[300px] mx-auto text-textGray font-medium text-lg md:text-2xl">
            Great, now let's create your kid's profile
          </p>
          <Button
            onClick={handleNext}
            type="button"
            className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow opacity-70"
          >
            Next
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          data-testid="signup-form"
          className="max-w-md w-full mx-auto flex flex-col gap-2"
        >
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
              <span className="text-red-500 text-xs">
                {errors.email.message}
              </span>
            )}
          </div>

          {/** Phone */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Phone Number</label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[100px] !rounded-xl !h-11">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                {...register("phoneNumber")}
                className="!rounded-xl !h-11 placeholder:text-textSubtitle flex-1"
                placeholder="Type Number"
                type="tel"
              />
            </div>
            {errors.phoneNumber && (
              <span className="text-red-500 text-xs">
                {errors.phoneNumber.message}
              </span>
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

          {/** Referral */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">How did you hear about us</label>
            <Input
              {...register("howDidYouHearAboutUs")}
              className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            />
            {errors.howDidYouHearAboutUs && (
              <span className="text-red-500 text-xs">
                {errors.howDidYouHearAboutUs.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      )}
    </>
  );
}
