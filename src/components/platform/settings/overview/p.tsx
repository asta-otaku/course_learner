import React from "react";
import { PadlockIcon } from "@/assets/svgs/padlock";
import { PaymentMethodIcon } from "@/assets/svgs/paymentCard";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import { useGetManageSubscription } from "@/lib/api/queries";
import { toast } from "react-toastify";

function StepZero({ setStep }: { setStep: (step: number) => void }) {
  const { data } = useGetManageSubscription();
  return (
    <>
      <div className="flex items-center gap-4 w-full">
        <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">
          Action
        </h2>
        <hr className="w-full" />
      </div>
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
          onClick={() => {
            if (data?.data?.url) {
              toast.success(data.message);
              window.open(data?.data.url, "_self");
            }
          }}
          className="bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <PaymentMethodIcon />
            <span className=" text-sm font-medium">Manage Payment Method</span>
          </div>
          <ArrowRightIcon />
        </div>
      </div>
    </>
  );
}

export default StepZero;
