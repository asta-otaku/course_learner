"use client";

import { Button } from "@/components/ui/button";
import { subscriptionPlans } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

function Subscriptions({ currentStep }: { currentStep: number }) {
  return (
    <div className="max-w-screen-2xl w-full h-full p-4 md:p-8 lg:p-12">
      <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
        step {currentStep + 1} out of 3
      </h5>
      <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase">
        CHOOSE THE PLAN BEST SUITED FOR YOUR CHILD
      </h2>
      <div className="max-w-[100vw] w-full overflow-y-auto scrollbar-hide flex gap-4 justify-center">
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.title}
            title={plan.title}
            price={plan.price}
            trialDays={plan.trialDays}
            features={plan.features}
          />
        ))}
      </div>
    </div>
  );
}

export default Subscriptions;

function Card({
  title,
  price,
  trialDays,
  features,
}: {
  title: string;
  price: number;
  trialDays: number;
  features: string[];
}) {
  const { push } = useRouter();
  return (
    <div
      onClick={() => {
        push("/sign-in");
      }}
      className="min-h-[60vh] max-h-[80vh] grow bg-white p-[5px] max-w-[300px] min-w-[300px] md:max-w-[380px] w-full rounded-3xl space-y-6 cursor-pointer"
    >
      <div className="bg-bgWhiteGray rounded-2xl p-4 space-y-4">
        <h4 className="text-textGray font-geist uppercase font-medium">
          The {title}
        </h4>
        <h2 className="text-textGray font-geist font-medium text-4xl">
          ${price}
        </h2>
        <p className="text-textSubtitle font-medium text-xs font-geist">
          {trialDays} days free trial included
        </p>
        <Button className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow">
          Get Started
        </Button>
      </div>
      <p className="font-geist text-textSubtitle text-xs font-medium text-center uppercase">
        The {title} plan include
      </p>
      <ul className="list-disc list-inside space-y-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="text-textSubtitle text-xs font-geist flex items-center gap-2"
          >
            <Image
              src="/checkmark-badge.svg"
              alt=""
              width={0}
              height={0}
              className="w-4"
            />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
