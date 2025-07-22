import React, { useState } from "react";
import testimonial from "@/assets/testimonial.png";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";

const testimonials = [
  {
    name: "John Doe",
    image: testimonial,
    text: "I'm so glad I found this platform. It's been a game-changer for me.",
  },
  {
    name: "Jane Doe",
    image: testimonial,
    text: "I'm so glad I found this platform. It's been a game-changer for me.",
  },
  {
    name: "John Doe",
    image: testimonial,
    text: "I'm so glad I found this platform. It's been a game-changer for me.",
  },
  {
    name: "John Doe",
    image: testimonial,
    text: "I'm so glad I found this platform. It's been a game-changer for me.",
  },
  {
    name: "John Doe",
    image: testimonial,
    text: "I'm so glad I found this platform. It's been a game-changer for me.",
  },
];

function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed`}
      aria-label={direction === "left" ? "Previous" : "Next"}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-white text-xl font-bold">
        {direction === "left" ? "←" : "→"}
      </span>
    </button>
  );
}

function Testimonials() {
  const [startIdx, setStartIdx] = useState(0);
  const visibleCount = 4;
  const canGoLeft = startIdx > 0;
  const canGoRight = startIdx + visibleCount < testimonials.length;

  const handleLeft = () => {
    if (canGoLeft) setStartIdx(startIdx - 1);
  };
  const handleRight = () => {
    if (canGoRight) setStartIdx(startIdx + 1);
  };

  return (
    <div className="py-16 max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-primaryBlue font-semibold uppercase font-geist">
          Testimonials
        </h2>
        <div className="flex gap-3">
          <Arrow direction="left" onClick={handleLeft} disabled={!canGoLeft} />
          <Arrow
            direction="right"
            onClick={handleRight}
            disabled={!canGoRight}
          />
        </div>
      </div>
      <div className="overflow-auto w-full scrollbar-hide">
        <div
          className="flex transition-transform duration-500 ease-in-out gap-6 md:ps-12 md:pe-12"
          style={{ transform: `translateX(-${startIdx * 25}%)` }}
        >
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden shadow-md bg-white relative flex flex-col h-80 flex-shrink-0 md:basis-1/4 md:w-1/4"
            >
              <img
                src={t.image.src}
                alt={t.name}
                className="object-cover w-full h-full"
              />
              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 text-white p-4">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs mt-1 leading-snug">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PricingSection />
    </div>
  );
}

function PricingSection() {
  const [plan, setPlan] = useState<"monthly" | "annually">("monthly");

  // You can update these values based on the plan if needed
  const price = plan === "monthly" ? 400 : 400; // Example: change to 350 for annually

  return (
    <div
      className="rounded-3xl relative overflow-visible min-h-[600px] flex flex-col items-center justify-start mx-auto  mt-52 z-1"
      style={{
        background: `linear-gradient(to bottom, #286CFF, #286CFF40 60%, #f5f5f5 100%)`,
      }}
    >
      {/* Anime Images */}
      <div className="absolute -top-[100px] left-0 -z-20">
        <Image src="/pricing-boy.svg" alt="boy" width={120} height={120} />
      </div>

      {/* Header */}
      <h3 className="text-white font-geist font-semibold text-center mt-14">
        OUR PRICING
        <br />
        AND SUBSCRIPTION
      </h3>
      {/* Toggle */}
      <div className="flex justify-center mt-6 mb-10">
        <div className="bg-bgWhiteGray rounded-full flex p-0.5">
          <button
            className={`px-6 py-2 rounded-full font-medium transition-colors text-sm ${
              plan === "monthly" ? "bg-white text-primaryBlue shadow" : ""
            }`}
            onClick={() => setPlan("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full font-medium transition-colors text-sm ${
              plan === "annually" ? "bg-white text-primaryBlue shadow" : ""
            }`}
            onClick={() => setPlan("annually")}
          >
            Annually
          </button>
        </div>
      </div>
      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8 w-full max-w-4xl mx-auto">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex-1 max-w-[380px] w-full">
          <div className="bg-primaryBlue p-4 text-white rounded-xl font-geist space-y-4">
            <h2 className="font-semibold">THE PLATFORM</h2>
            <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">
              ${price}
            </h1>
            <p className="text-xs font-semibold text-[#5FBCFF] font-geist">
              10 DAYS FREE TRIAL INCLUDED
            </p>
            <button className="bg-demo-gradient w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold">
              Subscribe
            </button>
          </div>
          <div className="flex h-8 items-center justify-center relative my-5">
            <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0"></div>
            <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
              THE PLATFORM PLAN INCLUDE
            </h2>
          </div>
          <ul className="space-y-3 mb-40 px-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-xs text-textSubtitle font-geist"
                >
                  <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                  <span>
                    We Have Analysed Thousands Past Paper Questions For Each
                    Topic, To Ensure The Worksheets Are Up To Exam Standard.
                  </span>
                </li>
              ))}
          </ul>
          <div className="text-sm text-center text-textSubtitle font-geist font-medium max-w-[280px] mx-auto">
            Do You Require More Information About The Pricing, You Can Request
            For A Call
          </div>
          <div className="px-4">
            <button className="w-full py-2 rounded-full bg-black shadow-demoShadow text-white font-semibold my-5">
              Request Call
            </button>
          </div>
        </div>
        {/* Card 2 */}
        <div className="relative z-0 h-full flex-1 max-w-[380px] w-full mt-20 md:mt-0">
          <div className="absolute -top-[120px] right-0 -z-10">
            <Image
              src="/pricing-girl.svg"
              alt="girl"
              width={120}
              height={120}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-1.5 flex-1 z-50 w-full">
            <div className="bg-bgWhiteGray p-4 text-textGray rounded-xl font-geist space-y-4">
              <h2 className="font-semibold">TUITION</h2>
              <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">
                ${price}
              </h1>
              <p className="text-xs font-semibold text-textSubtitle font-geist">
                10 DAYS FREE TRIAL INCLUDED
              </p>
              <button className="bg-demo-gradient text-white w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold">
                Subscribe
              </button>
            </div>
            <div className="flex h-8 items-center justify-center relative my-5">
              <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0"></div>
              <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
                TUITION PLAN INCLUDE
              </h2>
            </div>
            <ul className="space-y-3 mb-40 px-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-xs text-textSubtitle font-geist"
                  >
                    <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                    We Have Analysed Thousands Past Paper Questions For Each
                    Topic, To Ensure The Worksheets Are Up To Exam Standard.
                  </li>
                ))}
            </ul>
            <div className="text-sm text-center text-textSubtitle font-geist font-medium max-w-[280px] mx-auto">
              Do You Require More Information About The Pricing, You Can Request
              For A Call
            </div>
            <div className="px-4">
              <button className="w-full py-2 rounded-full bg-black shadow-demoShadow text-white font-semibold my-5">
                Request Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
