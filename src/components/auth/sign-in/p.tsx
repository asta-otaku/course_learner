"use client";

import { useState } from "react";
import { dummyProfiles as initialProfiles } from "@/lib/utils";
import { ChildProfile } from "../sign-up/profileSetup";
import SigninForm from "./signinForm";
import ProfileSelection from "./profileSelection";
import CreateProfile from "./createProfile";

export interface Profile {
  image: string;
  name: string;
  year: number | string;
  status: string;
}

export default function Signin() {
  const [step, setStep] = useState(0);

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  };

  return (
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      {
        {
          0: <SigninForm setStep={setStep} />,

          1: (
            <ProfileSelection
              profiles={profiles}
              setStep={setStep}
              handleAvatar={handleAvatar}
            />
          ),

          2: (
            <CreateProfile
              data={data}
              setData={setData}
              setStep={setStep}
              setProfiles={setProfiles}
              handleAvatar={handleAvatar}
              handleChange={handleChange}
            />
          ),
        }[step]
      }
    </div>
  );
}
