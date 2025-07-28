import { Button } from "@/components/ui/button";
import { otpSchema } from "@/lib/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef } from "react";

export interface OTPProps {
  email: string;
  onNext: () => void;
  setOtp: (otp: string) => void;
}

export default function OTP({ email, onNext, setOtp }: OTPProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: Array(6).fill("") },
  });
  const inputs = Array(6)
    .fill(0)
    .map(() => useRef<HTMLInputElement>(null));

  const handleOtpInput = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return;
    let otpArr = [...watch("otp")];
    let nextIndex = index;
    for (let i = 0; i < digits.length && nextIndex < 6; i++, nextIndex++) {
      otpArr[nextIndex] = digits[i];
      setValue("otp", [...otpArr]);
      if (nextIndex < 5) {
        inputs[nextIndex + 1].current?.focus();
      }
    }
    setOtp([...otpArr].join(""));
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      const otpArr = [...watch("otp")];
      if (otpArr[index] === "") {
        if (index > 0) {
          otpArr[index - 1] = "";
          setValue("otp", otpArr);
          inputs[index - 1].current?.focus();
          e.preventDefault();
        }
      } else {
        otpArr[index] = "";
        setValue("otp", otpArr);
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs[index - 1].current?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputs[index + 1].current?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtpArr = Array.from(pastedText.padEnd(6, " ").slice(0, 6));
    setValue("otp", newOtpArr);
    newOtpArr.forEach((char, index) => {
      if (char !== " ") {
        inputs[index].current!.value = char;
      }
    });
    setOtp(newOtpArr.join(""));
  };

  return (
    <form
      className="max-w-md w-full mx-auto flex flex-col gap-2"
      onSubmit={handleSubmit(onNext)}
    >
      <div className="flex flex-col gap-1">
        <label className="font-medium">Verification Code</label>
        <div className="flex items-center gap-3 justify between p-2 w-full">
          {watch("otp").map((value: string, index: number) => (
            <input
              key={index}
              ref={(el) => {
                register(`otp.${index}`).ref(el);
                inputs[index].current = el;
              }}
              className="w-8 h-8 text-center bg-transparent outline-none rounded-md p-1 border border-black/20 text-lg font-semibold"
              type="text"
              maxLength={6}
              value={value}
              onChange={(e) => {
                register(`otp.${index}`).onChange(e);
                handleOtpInput(index, e.target.value);
              }}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          ))}
        </div>
        {errors.otp && (
          <span className="text-red-500 text-xs">
            {errors.otp.message as string}
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
