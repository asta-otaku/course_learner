"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  usePostTrialSubscription,
  usePostSubscription,
  useValidateTrialSubscription,
} from "@/lib/api/mutations";
import { useRouter } from "next/navigation";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface StripePaymentPageProps {
  offerType: string;
  onBack: () => void;
}

const PaymentForm: React.FC<{ offerType: string; onBack: () => void }> = ({
  offerType,
  onBack,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: postTrialSubscription } = usePostTrialSubscription();
  const { mutateAsync: postSubscription } = usePostSubscription();
  const { mutateAsync: validateTrialSubscription } =
    useValidateTrialSubscription();

  useEffect(() => {
    const createSubscription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let res;
        if (offerType === "Offer One") {
          // For Offer One, use trial subscription API
          res = await postTrialSubscription();
        } else {
          // For other offers, use regular subscription API
          res = await postSubscription({ offerType });
        }

        if (res.status === 201) {
          if (offerType === "Offer One") {
            // For Offer One (trial), expect clientSecret
            if ("clientSecret" in res.data.data) {
              setClientSecret(res.data.data.clientSecret);
            } else {
              setError("Invalid response format for trial subscription");
            }
          } else {
            // For other offers, redirect to Stripe Checkout
            if ("url" in res.data.data) {
              window.open(res.data.data.url, "_self");
              return;
            } else {
              setError("Invalid response format for subscription");
            }
          }
        } else {
          setError("Failed to create subscription");
        }
      } catch (err) {
        console.error("Failed to create subscription:", err);
        setError("Failed to create subscription. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    createSubscription();
  }, [offerType, postTrialSubscription, postSubscription]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check if it's a SetupIntent or PaymentIntent based on the client secret format
      const isSetupIntent = clientSecret.startsWith("seti_");

      if (isSetupIntent) {
        // Use confirmCardSetup for trial subscriptions
        const { error, setupIntent } = await stripe.confirmCardSetup(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardNumberElement)!,
            },
          }
        );

        if (error) {
          console.error("Stripe error:", error);
          setError(error.message || "Payment setup failed");
        } else if (setupIntent.status === "succeeded") {
          console.log(setupIntent, "setupIntent");
          const res = await validateTrialSubscription({
            paymentMethodId: setupIntent.payment_method as string,
          });
          // if (res.status === 200) {
          //   router.push("/dashboard");
          // }
        }
      } else {
        // Use confirmCardPayment for regular payments
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardNumberElement)!,
            },
          }
        );

        if (error) {
          console.error("Stripe error:", error);
          setError(error.message || "Payment failed");
        } else if (paymentIntent.status === "succeeded") {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        `Payment failed: ${err instanceof Error ? err.message : "An unexpected error occurred"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your trial...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onBack} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {offerType === "Offer One"
                ? "Complete Your Trial"
                : "Complete Your Subscription"}
            </h1>
            <p className="text-gray-600">
              {offerType === "Offer One"
                ? "Enter your card details to start your 10-day free trial"
                : "Enter your card details to complete your subscription"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="p-3 border border-gray-300 rounded-lg bg-white">
                  <CardNumberElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#374151",
                          fontFamily: "system-ui, sans-serif",
                          "::placeholder": {
                            color: "#9CA3AF",
                          },
                        },
                        invalid: {
                          color: "#EF4444",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    <CardExpiryElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#374151",
                            fontFamily: "system-ui, sans-serif",
                            "::placeholder": {
                              color: "#9CA3AF",
                            },
                          },
                          invalid: {
                            color: "#EF4444",
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Code
                  </label>
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    <CardCvcElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#374151",
                            fontFamily: "system-ui, sans-serif",
                            "::placeholder": {
                              color: "#9CA3AF",
                            },
                          },
                          invalid: {
                            color: "#EF4444",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-4 bg-demo-gradient text-white font-medium rounded-lg shadow-demoShadow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing
                  ? "Processing..."
                  : offerType === "Offer One"
                    ? "Start Free Trial"
                    : "Complete Subscription"}
              </Button>

              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="w-full py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                ← Back to Plans
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StripePaymentPage: React.FC<StripePaymentPageProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentPage;
