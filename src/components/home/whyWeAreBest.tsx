"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Button } from "../ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";

function WhyWeAreBest() {
  const reasons = useMemo(
    () => [
      {
        title: "Clear teaching that actually makes sense",
        description:
          'Short, animated lessons that break topics down step-by-step, so your child understands the “why” - not just how to get the answer.',
      },
      {
        title: "Structure that keeps them consistent",
        description:
          "No more guessing what to do next. Everything is organised, and with Guided Learning, weekly work and support keep your child on track.",
      },
      {
        title: "We close gaps, not skip them",
        description:
          "We build from strong foundations and identify weak areas early, so your child doesn’t fall behind as topics get harder.",
      },
      {
        title: "Real confidence, not just correct answers",
        description:
          "As understanding improves, so does confidence - in class, in homework, and in exams like SATs and 11+.",
      },
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const { push } = useRouter();
  const activeReason = reasons[activeIndex];

  const goToPrev = () =>
    setActiveIndex((i) => (i - 1 + reasons.length) % reasons.length);
  const goToNext = () => setActiveIndex((i) => (i + 1) % reasons.length);

  return (
    <div className="py-32 max-w-3xl w-full mx-auto px-4">
      <Image
        src="/straight-boy.svg"
        alt="Why We Are Best"
        width={0}
        height={0}
        className="w-[194px] h-[249px] mx-auto"
      />
      <h2 className="text-primaryBlue uppercase font-geist font-semibold text-center text-sm md:text-base mt-8 mb-2">
        Why Parents Choose Us
      </h2>
      <div
        key={activeIndex}
        className="my-6 mx-auto motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
      >
        <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl xl:text-[32px] text-center">
          {activeIndex + 1}. {activeReason.title}
        </h1>

        <div className="w-full my-6 max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0 mt-0.5" />
            <p className="text-sm md:text-base font-geist text-textSubtitle">
              {activeReason.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          {reasons.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to reason ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={[
                "h-2 w-2 rounded-full transition-colors",
                idx === activeIndex ? "bg-primaryBlue" : "bg-primaryBlue/25",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div className="flex gap-4 w-full items-center">
          <Button
            variant="outline"
            type="button"
            onClick={goToPrev}
            aria-label="Previous reason"
            className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
          >
            <BackArrow color="#ffffff" />
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={goToNext}
            aria-label="Next reason"
            className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
          >
            <BackArrow color="#ffffff" flipped />
          </Button>

        </div>
        <Button
          onClick={() => push("/sign-in")}
          className="bg-demo-gradient shadow-demoShadow md:w-[180px] text-white rounded-full px-6 py-4"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

export default WhyWeAreBest;
