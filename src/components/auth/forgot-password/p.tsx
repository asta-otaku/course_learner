"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { ChangeEvent, useRef, useState } from "react";

function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState<string[]>(Array(6).fill(""));
  const [passwordvisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordvisible, setConfirmPasswordVisible] =
    useState<boolean>(false);

  const toggleVisibility = () => {
    setPasswordVisible(!passwordvisible);
  };
  const confirmToggleVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordvisible);
  };
  const inputs = Array(6)
    .fill(0)
    .map(() => useRef<HTMLInputElement>(null));

  const handleChange = (index: number, value: string) => {
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Focus on next input or previous if value is deleted
    if (value && index < 5) {
      inputs[index + 1].current?.focus();
    } else if (!value && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain").trim().slice(0, 6);
    const newOTP = Array.from(pastedText.padEnd(6, " ").slice(0, 6));
    setOTP(newOTP);
    newOTP.forEach((char, index) => {
      if (char !== " ") {
        inputs[index].current!.value = char;
      }
    });
  };

  const { push } = useRouter();

  return (
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      {
        {
          0: (
            <div className="w-full">
              <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
                Forgot password
              </h2>
              <p className="text-textSubtitle font-medium mb-6 text-center">
                Enter your registered email address ton recover your password
              </p>
              <form className="max-w-xl w-full mx-auto flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Email Address</label>
                  <Input
                    name="email"
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="!rounded-xl !h-11 placeholder:text-textSubtitle"
                    placeholder="johndoe@example.com"
                  />
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(1);
                  }}
                  type="submit"
                  className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
                >
                  Next
                </Button>
              </form>
            </div>
          ),
          1: (
            <div className="w-full">
              <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
                VERIFY EMAIL ADDRESS
              </h2>
              <p className="text-textSubtitle font-medium mb-6 text-center">
                Enter Code that was sent to {email}
              </p>
              <form className="max-w-md w-full mx-auto flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Verification Code</label>
                  <div className="flex items-center gap-3 justify between p-2 w-full">
                    {otp.map((value, index) => (
                      <input
                        key={index}
                        ref={inputs[index]}
                        className="w-8 h-8 text-center bg-transparent outline-none rounded-md p-1 border border-black/20 text-lg font-semibold"
                        type="text"
                        maxLength={1}
                        value={value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(index, e.target.value)
                        }
                        onPaste={handlePaste}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  type="submit"
                  className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
                >
                  Verify
                </Button>
              </form>
            </div>
          ),
          2: (
            <div className="w-full">
              <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
                Set New Password
              </h2>
              <p className="text-textSubtitle font-medium mb-6 text-center">
                Create a new password
              </p>
              <form className="max-w-xl w-full mx-auto flex flex-col gap-2">
                {/** Password */}
                <div className="relative flex flex-col gap-1">
                  <label className="font-medium">Password</label>
                  <Input
                    name="password"
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
                </div>

                {/** Confirm Password */}
                <div className="relative flex flex-col gap-1">
                  <label className="font-medium">Confirm Password</label>
                  <Input
                    name="password"
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
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    push("/sign-in");
                  }}
                  type="submit"
                  className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
                >
                  Verify
                </Button>
              </form>
            </div>
          ),
        }[step]
      }
      <Image
        src="/boy-one.svg"
        alt=""
        width={0}
        height={0}
        className={`w-32 absolute ${
          step > 0 ? "top-0" : "top-[30%]"
        } left-0 hidden md:block`}
      />
      <Image
        src="/girl-one.svg"
        alt=""
        width={0}
        height={0}
        className={`w-32 absolute ${
          step > 0 ? "bottom-0" : "bottom-[20%]"
        } right-0 hidden md:block`}
      />
    </div>
  );
}

export default ForgotPassword;
