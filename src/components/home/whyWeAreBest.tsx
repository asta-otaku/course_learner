"use client";

import React from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Button } from "../ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";

function WhyWeAreBest() {
  const nglWays = [
    "Our short, animated videos cover every topic in the KS2 and 11+ Maths syllabus. We have made them so simple, any child can understand it.",
    "Each video builds upon the content in previous videos to optimise learning.",
    "Many studies show that the best way to retain information is to recall what you have learnt as quickly as possible – this is our active recall strategy.",
    "We are the first platform to teach and immediately testeverything your child needs to know, ensuring they recall the content they have just learnt.",
  ];
  const { push } = useRouter();

  return (
    <div className="py-32 max-w-xl w-full mx-auto">
      <Image
        src="/straight-boy.svg"
        alt="Why We Are Best"
        width={0}
        height={0}
        className="w-[194px] h-[249px] mx-auto"
      />
      <h2 className="text-primaryBlue uppercase font-geist font-semibold text-center text-sm md:text-base mt-8 mb-2">
        Why We Are Best
      </h2>
      <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl xl:text-[32px] text-center">
        Teaching the 'NGL way'
      </h1>
      <div className="w-full space-y-2 my-8">
        {nglWays.map((way, index) => (
          <div key={index} className="flex items-center gap-3">
            <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0" />
            <p className="text-sm md:text-base font-geist text-textSubtitle capitalize">
              {way}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 w-full">
          <Button
            variant="outline"
            className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
          >
            <BackArrow color="#ffffff" />
          </Button>
          <Button
            variant="outline"
            className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
          >
            <BackArrow color="#ffffff" flipped />
          </Button>
        </div>
        <Button
          onClick={() => push("/sign-in")}
          className="bg-demo-gradient shadow-demoShadow md:w-[180px] text-white rounded-full px-6 py-4"
        >
          Start 10 Days Trial
        </Button>
      </div>
    </div>
  );
}

export default WhyWeAreBest;
