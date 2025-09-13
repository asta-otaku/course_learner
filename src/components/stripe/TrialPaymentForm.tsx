"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface TrialPaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<TrialPaymentFormProps> = ({
  clientSecret,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Check if it's a SetupIntent or PaymentIntent based on the client secret format
      const isSetupIntent = clientSecret.startsWith("seti_");

      if (isSetupIntent) {
        // Use confirmCardSetup for trial subscriptions
        const { error, setupIntent } = await stripe.confirmCardSetup(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement)!,
            },
          }
        );

        if (error) {
          console.error("Stripe error:", error);
          onError(error.message || "Payment setup failed");
        } else if (setupIntent.status === "succeeded") {
          onSuccess();
        }
      } else {
        // Use confirmCardPayment for regular payments
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement)!,
            },
          }
        );

        if (error) {
          console.error("Stripe error:", error);
          onError(error.message || "Payment failed");
        } else if (paymentIntent.status === "succeeded") {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      onError(
        `Payment failed: ${err instanceof Error ? err.message : "An unexpected error occurred"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#374151",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": {
                      color: "#9CA3AF",
                    },
                    padding: "12px",
                  },
                  invalid: {
                    color: "#EF4444",
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-demo-gradient text-white font-medium rounded-lg shadow-demoShadow hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Start Trial"}
      </Button>
    </form>
  );
};

const TrialPaymentForm: React.FC<TrialPaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default TrialPaymentForm;
