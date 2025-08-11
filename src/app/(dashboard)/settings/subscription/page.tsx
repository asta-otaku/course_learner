"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/assets/svgs/calendar";
import {
  useGetManageSubscription,
  useGetSubscriptionPlans,
} from "@/lib/api/queries";
import { SubscriptionPlan } from "@/lib/types";
import { toast } from "react-toastify";

function Page() {
  const { data } = useGetSubscriptionPlans(true, "");
  const { data: manageSubscription } = useGetManageSubscription();

  const subscriptionData = data?.data as SubscriptionPlan;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div>
        <h1 className="text-textGray font-semibold md:text-lg">Subscription</h1>
        <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
          An overview of your subscription details
        </p>
      </div>

      {/* Subscription Details */}
      {subscriptionData ? (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
            <h2 className="text-textGray font-semibold text-lg mb-4">
              Current Subscription
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Status:</span>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    subscriptionData.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {subscriptionData.status.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Offer Type:</span>
                <span className="text-textGray font-medium text-sm">
                  {subscriptionData.offerType}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">
                  Billing Start:
                </span>
                <span className="text-textGray font-medium text-sm">
                  {new Date(subscriptionData.startDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Billing End:</span>
                <span className="text-textGray font-medium text-sm">
                  {new Date(subscriptionData.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-black/15 shadow-sm p-6">
          <p className="text-textSubtitle text-center">
            No subscription data available
          </p>
        </div>
      )}

      {/* Payment Info */}
      <div className="mt-8">
        <div className="flex items-center gap-4 w-full mb-4">
          <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">
            Payment
          </h2>
          <hr className="w-full" />
        </div>

        <div className="text-xs text-textSubtitle flex flex-wrap justify-between items-center font-medium bg-white py-3 px-4 rounded-xl">
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <span>Manage your subscription</span>
          </div>
          <Button
            onClick={() => {
              if (manageSubscription?.data?.url) {
                toast.success(manageSubscription.message);
                window.open(manageSubscription?.data.url, "_self");
              }
            }}
            className="bg-black text-white text-xs px-5 py-2 rounded-full"
          >
            Manage Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Page;
