"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "@/lib/schema";
import { z } from "zod";
import { usePostLogin } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { getAndClearIntendedUrl } from "@/lib/services/axiosInstance";

function SigninForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { mutateAsync: postLogin, isPending } = usePostLogin();
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const toggleVisibility = () => setPasswordVisible((v) => !v);
  const { push } = useRouter();
  const onSubmit = async (data: z.infer<typeof signinSchema>) => {
    const res = await postLogin(data);
    if (res.status === 200) {
      localStorage.setItem(res.data.data.userRole, JSON.stringify(res.data));
      // Set flag to initialize socket
      localStorage.setItem("initializeSocket", "true");
      toast.success(res.data.message);
      
      // Check for intended URL first
      const intendedUrl = getAndClearIntendedUrl();
      
      if (intendedUrl) {
        // Redirect to the intended URL
        push(intendedUrl);
      } else {
        // Redirect to default path based on role
        const redirectPath =
          res.data.data.userRole === "parent"
            ? "/dashboard"
            : `/${res.data.data.userRole}`;
        push(redirectPath);
      }
    }
  };
  return (
    <div className="w-full flex flex-col items-center">
      <Link href="/" className="absolute top-[5%] left-[5%]">
        <Image src="/logo.svg" alt="" width={0} height={0} className="w-fit" />
      </Link>
      <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
        <span className="text-black">Welcome to</span> leap learners
      </h2>
      <p className="text-textSubtitle font-medium mb-6 text-center">
        Enter your details correctly
      </p>
      <form
        className="max-w-xl w-full mx-auto flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* email */}
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
        {/* password */}
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
        <Link
          href={isAdmin ? "/admin/forgot-password" : "/tutor/forgot-password"}
          className="text-right text-primaryBlue font-medium"
        >
          Forgot Password?
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="w-full flex gap-2 my-3 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
        </Button>
        <p className="text-center font-medium">
          Don&apos;t have an account?{" "}
          <Link
            href={isAdmin ? "/admin/sign-up" : "/tutor/sign-up"}
            className="text-primaryBlue"
          >
            Sign Up
          </Link>
        </p>
      </form>
      <Image
        src="/boy-one.svg"
        alt=""
        width={0}
        height={0}
        className="w-32 absolute top-[30%] left-0 hidden md:block"
      />
      <Image
        src="/girl-one.svg"
        alt=""
        width={0}
        height={0}
        className="w-32 absolute bottom-[20%] right-0 hidden md:block"
      />
      <div className="absolute bottom-0 hidden md:flex gap-6">
        <Image
          src="/footerboy-one.svg"
          alt=""
          width={0}
          height={0}
          className="w-32"
        />
        <Image
          src="/footerboy-two.svg"
          alt=""
          width={0}
          height={0}
          className="w-32"
        />
        <Image
          src="/footergirl.svg"
          alt=""
          width={0}
          height={0}
          className="w-32"
        />
      </div>
    </div>
  );
}

export default SigninForm;
