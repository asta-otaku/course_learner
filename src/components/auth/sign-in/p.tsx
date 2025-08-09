"use client";

import { useState } from "react";
import { ChildProfile } from "../sign-up/profileSetup";
import SigninForm from "./signinForm";
import ProfileSelection from "./profileSelection";
import CreateProfile from "./createProfile";

export default function Signin() {
  const [step, setStep] = useState(0);

  const [data, setData] = useState<ChildProfile>({
    avatar: null,
    name: "",
    year: "",
    status: "active",
  });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.target.files?.[0]) {
      setData((d) => ({ ...d, avatar: e.target.files![0] }));
    }
  };

  return (
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      {
        {
          0: <SigninForm setStep={setStep} />,

          1: <ProfileSelection setStep={setStep} />,

          2: (
            <CreateProfile
              data={data}
              setData={setData}
              setStep={setStep}
              handleAvatar={handleAvatar}
            />
          ),
        }[step]
      }
    </div>
  );
}
