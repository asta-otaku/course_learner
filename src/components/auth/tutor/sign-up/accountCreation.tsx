"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, PlusCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [formData, setFormData] = useState<{
    avatar: File | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }>({
    avatar: null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { push } = useRouter();

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData((d) => ({ ...d, avatar: e.target.files![0] }));
    }
  };

  const toggleVisibility = () => setPasswordVisible((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        onSubmit={handleNext}
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
            {formData.avatar ? (
              <div className="relative w-full h-full">
                <img
                  src={URL.createObjectURL(formData.avatar)}
                  alt="Avatar preview"
                  className="object-cover rounded-lg w-full h-full"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setFormData((d) => ({ ...d, avatar: null }));
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
        {/** First Name */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">First Name</label>
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="John"
          />
        </div>

        {/** Last Name */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Last Name</label>
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Doe"
          />
        </div>

        {/** Email */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Email Address</label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="johndoe@example.com"
          />
        </div>

        {/** Phone */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Phone Number</label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="Type Number"
          />
        </div>

        {/** Password */}
        <div className="relative flex flex-col gap-1">
          <label className="font-medium">Password</label>
          <Input
            name="password"
            type={passwordVisible ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
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
        </div>

        {/** Confirm Password */}
        <div className="relative flex flex-col gap-1">
          <label className="font-medium">Confirm Password</label>
          <Input
            name="confirmPassword"
            type={passwordVisible ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
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
