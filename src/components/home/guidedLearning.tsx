"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LearningPreviewMedia } from "./learningPreviewMedia";
import star from "@/assets/star.svg";
import Image from "next/image";

/** `GUIDED_STEPS` index for “Weekly Work Assigned” — show `video.mp4` with `guildedThree` fallback */
const WEEKLY_WORK_ACCORDION_INDEX = 2;

/**
 * [0] intro / default; [1]–[5] = accordion items (Baseline → … → Optional video)
 */
const GUIDED_IMAGES = [
  "/guildedOne.svg",
  "/guildedOne.svg",
  "/guildedTwo.svg",
  "/guildedThree.svg",
  "/guildedFour.svg",
  "/guildedFive.svg",
  "/guildedSix.svg",
] as const;

type Step = { title: string; body: string };

const GUIDED_STEPS: Step[] = [
  {
    title: "A Personal Learning Buddy",
    body: "Your child is matched with a dedicated buddy who supports their learning and keeps them on track.",
  },
  {
    title: "Baseline Assessment",
    body: "We identify exactly what your child knows - and where they need help.",
  },
  {
    title: "Weekly Work Assigned",
    body: "Your child receives structured weekly assignments, after being taught by clear animated videos.",
  },
  {
    title: "Feedback On Their Work",
    body: "Work is reviewed and feedback is provided to help your child improve.",
  },
  {
    title: "Message Your Buddy Anytime",
    body: "Stuck on a question? Your child can message their buddy directly for help.",
  },
  {
    title: "Optional 1-To-1 Video Support",
    body: "Book a video session whenever your child needs an extra explanation or support.",
  },
];

function GuidedLearning() {
  const { push } = useRouter();
  /** `null` = default intro (guildedOne, no accordion open). 0–4 = open accordion + guilded image index+2 */
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const imageIndex = openAccordion === null ? 0 : openAccordion + 1;
  const mediaKey = `${imageIndex}-${openAccordion ?? "intro"}`;

  const goSignIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    push("/sign-in");
  };

  const toggle = (index: number) => {
    setOpenAccordion((prev) => (prev === index ? null : index));
  };

  return (
    <div className="overflow-hidden bg-[#DFF2FF] rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 grid grid-cols-1 xl:grid-cols-[7fr_4fr] gap-2 items-center mt-8 md:mt-10">
      <div
        className={cn(
          "min-w-0 flex items-center justify-center w-full order-2 xl:order-1",
          openAccordion !== WEEKLY_WORK_ACCORDION_INDEX && "xl:-ml-6"
        )}
      >
        <LearningPreviewMedia
          key={mediaKey}
          mediaKey={mediaKey}
          useVideo={openAccordion === WEEKLY_WORK_ACCORDION_INDEX}
          imageSrc={GUIDED_IMAGES[imageIndex]}
          alt={
            openAccordion === null
              ? "Guided learning with a personal buddy"
              : GUIDED_STEPS[openAccordion].title
          }
          priority={openAccordion === null}
          sizes="(min-width: 1024px) 70vw, 100vw"
          mediaAlign="start"
        />
      </div>

      <div className="min-w-0 flex flex-col justify-center w-full order-1 xl:order-2">
        <div
          className={cn(
            "rounded-lg -mx-1 px-1 py-1 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF]/30 mb-2",
            openAccordion === null && "bg-[#286CFF]/8"
          )}
          onClick={() => setOpenAccordion(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenAccordion(null);
            }
          }}
          tabIndex={0}
          aria-label="Guided learning overview; select to show the default slide"
        >
          <div className="inline-flex items-center gap-1.5 rounded bg-primaryBlue py-0.5 px-1.5 text-[10px] font-bold uppercase tracking-wide text-[#DFF2FF] mb-2">
            <Image src={star} alt="Star" className="w-3 h-3" />
            Most popular
          </div>

          <p className="text-[10px] sm:text-xs font-bold font-geist uppercase tracking-wider text-left mb-2 text-[#286CFF]">
            For parents who want everything handled
          </p>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-geist text-left leading-snug mb-3">
            2. Guided Learning With A Personal Buddy
          </h2>

          <p className="text-sm text-textSubtitle leading-relaxed font-geist mb-5 text-left">
            A dedicated buddy who{" "}
            <span className="font-semibold">assesses gaps, sets weekly</span> work, and
            provides <span className="font-semibold">1-to-1 help</span> whenever your
            child gets stuck. You hand it over. We handle it.
          </p>

          <Button
            type="button"
            onClick={goSignIn}
            className="mb-0 w-full sm:w-auto rounded-full bg-demo-gradient text-white font-semibold shadow-demoShadow hover:opacity-90 transition-opacity self-center sm:self-start"
          >
            Start 10 Days Trials
          </Button>
        </div>

        <div className="divide-y divide-[#286CFF]/15 border-t border-[#286CFF]/15 font-geist mt-4">
          {GUIDED_STEPS.map((step, index) => {
            const isOpen = openAccordion === index;
            return (
              <div key={step.title} className="py-1">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start text-left py-4 font-geist"
                >
                  <span
                    className={cn(
                      "text-sm font-semibold leading-snug transition-colors font-geist",
                      isOpen ? "text-[#286CFF]" : "text-gray-900"
                    )}
                  >
                    {step.title}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-4 -mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-sm text-textSubtitle leading-relaxed">{step.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GuidedLearning;
