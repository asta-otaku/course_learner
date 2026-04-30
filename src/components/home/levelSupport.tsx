"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import GuidedLearning from "./guidedLearning";
import { LearningPreviewMedia } from "./learningPreviewMedia";

const STEP_IMAGES = [
  "/selfOne.svg", // intro / poster
  "/selfTwo.svg", // step 1 (video poster)
  "/selfThree.svg",
  "/selfFour.svg",
  "/selfFive.svg",
] as const;

type Step = {
  title: string;
  body: React.ReactNode;
};

const SELF_DIRECTED_INTRO: Step = {
  title: "Self - Directed Learning Platform",
  body: "Instant access to a 147 animated lessons explains the why behind the maths. You set the pace while your child builds confidence.",
};

const SELF_DIRECTED_STEPS: Step[] = [
  {
    title: "Animated Lessons That Actually Explain",
    body: "Short, clear videos that break down each topic step-by-step so your child understands why the maths works.",
  },
  {
    title: "Structured Quizzes That Build Confidence",
    body: "Each lesson is followed by quizzes designed to reinforce understanding and build fluency.",
  },
  {
    title: "Progress Dashboard For Parents",
    body: "See exactly what your child has completed, where they’re improving, and what they need to work on next.",
  },
  {
    title: "Search Any Topic Instantly",
    body: "Use the glossary to quickly find and revisit any maths topic whenever needed.",
  },
];

function LevelSupport() {
  const { push } = useRouter();
  // Default open accordion = first step
  const [openAccordion, setOpenAccordion] = useState<number>(0);

  // Media is driven ONLY by the accordion selection (intro text is static).
  const imageIndex = openAccordion + 1;
  const mediaKey = `${imageIndex}-${openAccordion}`;

  const preloadImageSrcs = React.useMemo(() => {
    const candidateStepIndices = [openAccordion - 1, openAccordion + 1].filter(
      (i) => i >= 0 && i < SELF_DIRECTED_STEPS.length
    );
    const imgIndices = candidateStepIndices
      .map((i) => i + 1) // step -> image index
      .filter((i) => i >= 0 && i < STEP_IMAGES.length);
    return Array.from(new Set(imgIndices.map((i) => STEP_IMAGES[i])));
  }, [openAccordion]);

  const goSignIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    push("/sign-in");
  };

  const toggle = (sliceIndex: number) => {
    setOpenAccordion(sliceIndex);
  };

  return (
    <div className="pt-32 pb-12 max-w-screen-2xl w-full mx-auto px-4 md:px-8">
      <div className="flex flex-col items-center px-4 text-center mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-[45px] font-geist font-semibold max-w-2xl">
          Choose The <span className="text-primaryBlue">Level Of Support</span>{" "}
          Your Child Needs
        </h1>
        <p className="text-textSubtitle font-medium mt-2">
          Select the level of support your family needs
        </p>
      </div>

      <div className="overflow-hidden bg-[#DCFFCF] rounded-2xl md:rounded-3xl p-4 flex flex-col items-center gap-2 w-full xl:flex-row xl:items-stretch xl:justify-between">
        <div className="min-w-0 flex min-h-0 shrink flex-col justify-center w-full self-stretch xl:flex-[4] xl:basis-0">
          <p className="text-xs font-bold font-geist uppercase text-center xl:text-left text-[#1D6F00]">
            For parents who want to take the lead
          </p>

          {/* Static intro (NOT tied to accordion/media) */}
          <div className="rounded-lg -mx-1 px-1 py-1 my-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-geist text-left leading-snug mb-3">
              1. {SELF_DIRECTED_INTRO.title}
            </h2>
            <p className="text-sm text-textSubtitle leading-relaxed max-w-xl text-left">
              {SELF_DIRECTED_INTRO.body}
            </p>
            <Button
              type="button"
              onClick={goSignIn}
              className="mt-5 rounded-full bg-demo-gradient bg-[#2D9B06] text-white shadow-demoShadow font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </Button>
          </div>

          <div className="divide-y divide-[#1D6F00]/20 border-t border-[#1D6F00]/20 font-geist mt-4">
            {SELF_DIRECTED_STEPS.map((step, idx) => {
              const isOpen = openAccordion === idx;
              return (
                <div key={step.title} className="py-1">
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start text-left py-4 font-geist"
                  >
                    <span
                      className={cn(
                        "text-sm md:text-base font-semibold leading-snug transition-colors font-geist",
                        isOpen ? "text-[#1D6F00]" : "text-gray-900"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pb-5 -mt-1 pl-0 md:pl-0 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-sm text-textSubtitle leading-relaxed max-w-xl">
                        {step.body}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex min-h-0 w-full shrink items-stretch justify-center self-stretch xl:flex-[7] xl:basis-0 xl:justify-end">
          {/* Preload adjacent step artwork for faster accordion switching */}
          <div
            aria-hidden="true"
            className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
          >
            {preloadImageSrcs.map((src) => (
              <Image key={src} src={src} alt="" width={1} height={1} sizes="1px" />
            ))}
          </div>
          <LearningPreviewMedia
            key={mediaKey}
            mediaKey={mediaKey}
            // Self-directed: first step opens the video
            useVideo={openAccordion === 0}
            imageSrc={STEP_IMAGES[imageIndex]}
            alt={String(SELF_DIRECTED_STEPS[openAccordion]?.title ?? SELF_DIRECTED_INTRO.title)}
            priority={openAccordion === 0}
            sizes="(min-width: 1024px) 70vw, 100vw"
            mediaAlign="end"
            fillColumnHeight
          />
        </div>
      </div>

      <GuidedLearning />
    </div>
  );
}

export default LevelSupport;
