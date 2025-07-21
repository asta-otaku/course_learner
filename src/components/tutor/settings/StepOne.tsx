import BackArrow from "@/assets/svgs/arrowback";
import React from "react";

function StepOne({ setStep }: { setStep: (step: number) => void }) {
  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-start gap-12 w-full mb-6">
        <div
          className="self-start text-sm cursor-pointer"
          onClick={() => setStep(0)}
        >
          <BackArrow color="#808080" />
        </div>
        <div>
          <h1 className="text-textGray font-semibold md:text-lg">
            Change Password
          </h1>
          <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
            Reset Password
          </p>
        </div>
      </div>
      <form className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            Old Password
          </label>
          <input
            type="email"
            placeholder="Place@gmail.com"
            className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            New Password
          </label>
          <input
            type="password"
            placeholder="Enter Password"
            className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black block mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="Enter Password"
            className="w-full bg-transparent border border-gray-300 rounded-2xl px-4 py-3 text-sm placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white font-medium text-sm py-3 rounded-full mt-4 w-full"
        >
          Confirm
        </button>
      </form>
    </div>
  );
}

export default StepOne;
