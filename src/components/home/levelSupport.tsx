"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import GuidedLearning from "./guidedLearning";
import { LearningPreviewMedia } from "./learningPreviewMedia";

const STEP_IMAGES = [
    "/selfOne.svg",
    "/selfTwo.svg",
    "/selfThree.svg",
    "/selfFour.svg",
    "/selfFive.svg",
] as const;

type Step = {
    title: string;
    body: React.ReactNode;
};

const STEPS: Step[] = [
    {
        title: "Self - Directed Learning Platform",
        body: "Instant access to a 147 animated lessons explains the why behind the maths. You set the pace while your child builds confidence.",
    },
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
    const [openAccordion, setOpenAccordion] = useState<number | null>(null);

    const imageIndex = openAccordion === null ? 0 : openAccordion + 1;
    const mediaKey = `${imageIndex}-${openAccordion ?? "intro"}`;

    const goSignIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        push("/sign-in");
    };

    const toggle = (sliceIndex: number) => {
        setOpenAccordion((prev) => (prev === sliceIndex ? null : sliceIndex));
    };

    return (
        <div className="pt-32 pb-12 max-w-screen-2xl w-full mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center px-4 text-center mb-10">
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-[45px] font-geist font-semibold max-w-2xl">
                    Choose The <span className="text-primaryBlue">Level Of Support</span> Your Child Needs
                </h1>
                <p className="text-textSubtitle font-medium mt-2">Select the level of support your family needs</p>
            </div>

            <div className="overflow-hidden bg-[#DCFFCF] rounded-2xl md:rounded-3xl p-4 flex flex-col items-center gap-2 w-full xl:flex-row xl:items-stretch xl:justify-between">
                <div className="min-w-0 flex min-h-0 shrink flex-col justify-center w-full self-stretch xl:flex-[4] xl:basis-0">
                    <p className="text-xs font-bold font-geist uppercase text-center xl:text-left text-[#1D6F00]">
                        For parents who want to take the lead
                    </p>

                    <div
                        className={cn(
                            "rounded-lg -mx-1 px-1 py-1 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#1D6F00]/30 my-2",
                            openAccordion === null && "bg-[#1D6F00]/8"
                        )}
                        onClick={() => setOpenAccordion(null)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpenAccordion(null);
                            }
                        }}
                        tabIndex={0}
                        aria-label="Self-directed platform overview; select to show this slide"
                    >
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-geist text-left leading-snug mb-3">
                            1. {STEPS[0].title}
                        </h2>
                        <p className="text-sm text-textSubtitle leading-relaxed max-w-xl text-left">
                            {STEPS[0].body}
                        </p>
                        <Button
                            type="button"
                            onClick={goSignIn}
                            className="mt-5 rounded-full bg-demo-gradient bg-[#2D9B06] text-white shadow-demoShadow font-semibold hover:opacity-90 transition-opacity"
                        >
                            Start 10 Days Trials
                        </Button>
                    </div>

                    <div className="divide-y divide-[#1D6F00]/20 border-t border-[#1D6F00]/20 font-geist mt-4">
                        {STEPS.slice(1).map((step, idx) => {
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
                                            <p className="text-sm text-textSubtitle leading-relaxed max-w-xl">{step.body}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="min-w-0 flex min-h-0 w-full shrink items-stretch justify-center self-stretch xl:flex-[7] xl:basis-0 xl:justify-end">
                    <LearningPreviewMedia
                        key={mediaKey}
                        mediaKey={mediaKey}
                        useVideo={openAccordion === null}
                        imageSrc={STEP_IMAGES[imageIndex]}
                        alt={
                            openAccordion === null
                                ? STEPS[0].title
                                : String(STEPS[openAccordion + 1].title)
                        }
                        priority={openAccordion === null}
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
