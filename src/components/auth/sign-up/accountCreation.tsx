"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export interface AccountCreationProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function AccountCreation({
  currentStep,
  setCurrentStep,
}: AccountCreationProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    referral: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [successStep, setSuccessStep] = useState(false);

  const toggleVisibility = () => setPasswordVisible((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you could also validate & send formData to your API...
    setSuccessStep(true);
  };

  const handleNext = () => {
    setCurrentStep(1);
  };

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
          onSubmit={handleSubmit}
          data-testid="signup-form"
          className="max-w-md w-full mx-auto flex flex-col gap-2"
        >
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

          {/** Referral */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">How did you hear about us</label>
            <Input
              name="referral"
              value={formData.referral}
              onChange={handleChange}
              className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            />
          </div>

          <Button
            type="submit"
            className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
          >
            Create Account
          </Button>
        </form>
      )}
    </>
  );
}
