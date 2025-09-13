"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState } from "react";
import { useGetSubscriptionPlans } from "@/lib/api/queries";
import { usePostSubscription } from "@/lib/api/mutations";
import { FullSubscriptionPlan } from "@/lib/types";
import StripePaymentPage from "@/components/stripe/StripePaymentPage";

function Subscriptions({ currentStep }: { currentStep?: number }) {
  const { data } = useGetSubscriptionPlans();
  const [step, setStep] = useState(0);
  const plans = data?.data as FullSubscriptionPlan[];
  return (
    <div>
      {
        {
          0: (
            <div className="mx-auto w-full h-full p-4 md:p-8 lg:p-12">
              {currentStep ? (
                <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
                  step {currentStep + 1} out of 3
                </h5>
              ) : null}
              <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase">
                CHOOSE THE PLAN BEST SUITED FOR YOUR CHILD
              </h2>
              <div className="max-w-full w-full overflow-y-auto scrollbar-hide flex gap-4 justify-center">
                {plans
                  ?.slice()
                  ?.reverse()
                  .map((plan) => (
                    <Card
                      key={plan.id}
                      title={plan.name}
                      price={plan.default_price.unit_amount}
                      trialDays={plan.description}
                      features={plan.attributes}
                      offerType={plan.metadata.offerType}
                      isTrial={plan.metadata.offerType === "Offer One"}
                      onStartTrial={() => setStep(1)}
                    />
                  ))}
              </div>
            </div>
          ),
          1: (
            <StripePaymentPage
              offerType="Offer One"
              onBack={() => setStep(0)}
            />
          ),
        }[step]
      }
    </div>
  );
}

export default Subscriptions;

function Card({
  title,
  price,
  trialDays,
  features,
  offerType,
  isTrial,
  onStartTrial,
}: {
  title: string;
  price: number;
  trialDays: string;
  features: string[];
  offerType: string;
  isTrial?: boolean;
  onStartTrial?: () => void;
}) {
  const { mutateAsync: postSubscription } = usePostSubscription();

  const handleClick = async () => {
    if (isTrial && onStartTrial) {
      // For Offer One (trial), go to payment step
      onStartTrial();
    } else {
      // For other offers, use regular subscription flow
      const res = await postSubscription({ offerType });
      if (res.status === 201) {
        window.open(res.data.data.url, "_self");
      }
    }
  };

  return (
    <div className="min-h-[60vh] max-h-[80vh] grow bg-white p-[5px] max-w-[300px] min-w-[300px] md:max-w-[380px] w-full rounded-3xl space-y-6 cursor-pointer">
      <div className="bg-bgWhiteGray rounded-2xl p-4 space-y-4">
        <h4 className="text-textGray font-geist uppercase font-medium">
          The {title}
        </h4>
        <h2 className="text-textGray font-geist font-medium text-4xl">
          £{price / 100}
        </h2>
        <p className="text-textSubtitle font-medium text-xs font-geist h-8">
          {trialDays}
        </p>
        <Button
          onClick={handleClick}
          className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        >
          {isTrial ? "Start Free Trial" : "Get Started"}
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
