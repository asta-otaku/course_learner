"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { ExternalLink, GraduationCap, Lightbulb, Music } from "lucide-react";
import SiteNav from "./siteNav";
import Footer from "./footer";

const sections = [
  {
    icon: GraduationCap,
    label: "The Background",
    body: "Ire's passion for teaching began long before his professional career; he started tutoring students during his own time as an Academic Scholar at Brentwood School. After achieving A*A*A at A-Level, he went on to read Mathematics and Economics at the London School of Economics (LSE).",
  },
  {
    icon: Lightbulb,
    label: "The Vision",
    body: "Following a career in Finance, Ire returned to his roots in education with a clear mission: making high-quality maths support affordable and accessible. To achieve this, he taught himself to code specifically to bridge the gap between mathematical precision and modern technology. Today, alongside driving the technical direction of Leap Learners, he works as a Software Engineer at NatWest, ensuring that the 'why' behind the maths is always front and centre for every child preparing for school, SATs, or the 11+.",
  },
  {
    icon: Music,
    label: "Life Outside of Leap",
    body: "When he's not solving equations or coding, Ire is a professional pianist. One of his most memorable highlights was playing for Yemi Alade at the United Nations. Whether he's at a piano or a computer, Ire is driven by the same thing: precision, performance, and helping others hit their high notes.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-bgWhiteGray min-h-screen">
      {/* ── Blue header ── */}
      <div className="bg-primaryBlue rounded-b-[2.5rem]">
        <div className="max-w-screen-2xl mx-auto text-white">
          <SiteNav active="about" />
          <div className="text-center py-7 md:py-10 px-4">
            <p className="text-[#BBD0FF] font-semibold font-geist uppercase text-xs tracking-[0.2em] mb-2">
              Our Story
            </p>
            <h1 className="font-geist font-semibold text-2xl md:text-3xl lg:text-4xl leading-tight">
              About Leap Learners
            </h1>
          </div>
        </div>
      </div>

      {/* ── Founder section ── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <div className="w-full flex justify-center">
            <div className="relative w-72 md:w-[340px] lg:w-[400px]">
              <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/founder.jpeg"
                  alt="Ire — Founder of Leap Learners"
                  fill
                  className="object-cover rounded-3xl"
                  priority
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-5 py-2 shadow-lg border border-gray-100 flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-sm font-semibold font-geist text-gray-800">
                  Founder & CEO
                </span>
              </div>
            </div>
          </div>

          {/* Intro text */}
          <div className="flex flex-col gap-7 mt-8 lg:mt-0">
            <div>
              <p className="text-primaryBlue font-semibold font-geist uppercase text-xs tracking-[0.2em] mb-2">
                Meet the Founder
              </p>
              <h2 className="font-semibold text-4xl md:text-5xl font-geist">
                Ire
              </h2>
              <p className="text-textSubtitle font-medium font-geist mt-2 text-base">
                Mathematician · Software Engineer · Musician
              </p>
            </div>

            <blockquote className="bg-blue-50 border-l-4 border-primaryBlue rounded-r-2xl px-6 py-5">
              <p className="text-base md:text-lg font-geist font-medium leading-relaxed text-gray-800 italic">
                "I created Leap Learners because most children don't struggle
                with maths because it's hard — they struggle because it isn't
                explained clearly enough. My goal is to replace memorisation
                with true understanding."
              </p>
            </blockquote>

            <Button
              asChild
              className="w-fit bg-demo-gradient shadow-demoShadow text-white rounded-full px-7 py-5 font-geist font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <a
                href="https://www.linkedin.com/in/iretundesoleye/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View LinkedIn Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* ── Story sections ── */}
        <div className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map(({ icon: Icon, label, body }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-5 hover:shadow-md hover:border-primaryBlue/20 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-demo-gradient flex items-center justify-center shadow-demoShadow shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-lg font-geist">{label}</h3>
                <p className="text-textSubtitle font-medium font-geist leading-relaxed text-sm">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
