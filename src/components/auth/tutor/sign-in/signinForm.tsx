"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

function SigninForm() {
  const [formDetails, setFormDetails] = useState({
    email: "",
    password: "",
  });
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const toggleVisibility = () => setPasswordVisible((v) => !v);
  const { push } = useRouter();
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
      <form className="max-w-xl w-full mx-auto flex flex-col gap-4">
        {/* email */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Email Address</label>
          <Input
            name="email"
            type="email"
            value={formDetails.email}
            onChange={(e) =>
              setFormDetails((f) => ({ ...f, email: e.target.value }))
            }
            className="!rounded-xl !h-11 placeholder:text-textSubtitle"
            placeholder="johndoe@example.com"
          />
        </div>
        {/* password */}
        <div className="relative flex flex-col gap-1">
          <label className="font-medium">Password</label>
          <Input
            name="password"
            type={passwordVisible ? "text" : "password"}
            value={formDetails.password}
            onChange={(e) =>
              setFormDetails((f) => ({
                ...f,
                password: e.target.value,
              }))
            }
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

        <Link
          href={isAdmin ? "/admin/forgot-password" : "/tutor/forgot-password"}
          className="text-right text-primaryBlue font-medium"
        >
          Forgot Password?
        </Link>

        <Button
          onClick={(e) => {
            e.preventDefault();
            if (isAdmin) {
              push("/admin/dashboard");
            } else {
              push("/tutor/dashboard");
            }
          }}
          type="submit"
          className="w-full flex gap-2 my-3 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        >
          Sign In
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
