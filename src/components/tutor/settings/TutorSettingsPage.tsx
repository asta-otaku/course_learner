import React from "react";
import { PadlockIcon } from "@/assets/svgs/padlock";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import { ManageProfileIcon } from "@/assets/svgs/manageProfile";
import EmailScheduleIcon from "@/assets/svgs/emailSchedule";

function StepZero({ setStep }: { setStep: (step: number) => void }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-1.5 border border-black/20 space-y-1">
        <div
          onClick={() => setStep(1)}
          className="bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <PadlockIcon />
            <span className=" text-sm font-medium">Change Password</span>
          </div>
          <ArrowRightIcon />
        </div>
        <div
          onClick={() => setStep(2)}
          className="bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <ManageProfileIcon />
            <span className=" text-sm font-medium">Manage Profile</span>
          </div>
          <ArrowRightIcon />
        </div>
        <div
          onClick={() => setStep(3)}
          className="bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <EmailScheduleIcon />
            <span className=" text-sm font-medium">Your Schedule</span>
          </div>
          <ArrowRightIcon />
        </div>
      </div>
    </>
  );
}

export default StepZero;
