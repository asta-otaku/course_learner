"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SiteNav from "./siteNav";
import Footer from "./footer";

const faqs = [
  {
    id: "faq-1",
    question: "What is Leap Learners?",
    answer:
      "Leap Learners is an online maths learning platform for primary school children (Years 1–6). We combine clear, animated lessons with structured practice to help children build real understanding and confidence in maths.",
  },
  {
    id: "faq-2",
    question: "How does Leap Learners work?",
    answer:
      "You can choose between two options. Our Self-Directed Learning Platform gives your child full access to lessons and quizzes to work through at their own pace. Our Guided Learning programme includes a Personal Buddy who assesses your child, sets weekly work, provides feedback, and offers support when needed.",
  },
  {
    id: "faq-3",
    question: "What’s the difference between Self-Directed Learning and Guided Learning?",
    answer:
      "Self-Directed Learning is ideal for parents who want to take the lead and guide their child through the platform. Guided Learning is for parents who want everything handled — with structured weekly plans, feedback, and support from a dedicated Learning Buddy.",
  },
  {
    id: "faq-4",
    question: "Does Leap Learners follow the national curriculum?",
    answer:
      "Yes. We cover the full primary school maths curriculum, while structuring topics in a way that builds understanding and prepares children effectively for school, SATs, and 11+ exams.",
  },
  {
    id: "faq-5",
    question: "Will this help my child improve in maths?",
    answer:
      "Yes - when used consistently, Leap Learners helps children build strong foundations, close gaps in their knowledge, and develop confidence across all key topics.",
  },
  {
    id: "faq-6",
    question: "Can my child use the platform on their own?",
    answer:
      "Yes. The lessons are designed to be clear and easy to follow independently. However, younger children or those who need more structure may benefit from the Guided Learning option.",
  },
  {
    id: "faq-7",
    question: "What age is Leap Learners suitable for?",
    answer:
      "Leap Learners is designed for children in Years 1–6. The platform adapts to your child’s level, whether they are catching up, keeping up, or aiming to excel.",
  },
  {
    id: "faq-8",
    question: "What happens if my child has gaps in their knowledge?",
    answer:
      "Our system is designed to identify and address gaps. In Guided Learning, your child starts with a baseline assessment and is given personalised weekly work. In the platform, you can also search topics directly using the glossary.",
  },
  {
    id: "faq-9",
    question: "How often should my child use Leap Learners?",
    answer:
      "We recommend consistent weekly use. In Guided Learning, this is structured for you. In Self-Directed Learning, most families aim for a few sessions per week to build steady progress.",
  },
  {
    id: "faq-10",
    question: "Will my child need live tutoring sessions?",
    answer:
      "Not necessarily. Our videos and structured practice are designed to teach concepts clearly. Live sessions are available if needed, but many children progress well without frequent sessions.",
  },
  {
    id: "faq-11",
    question: "How do I track my child’s progress?",
    answer:
      "You can view your child’s performance through the platform dashboard. In Guided Learning, you will also receive updates on progress, feedback, and areas to improve.",
  },
  {
    id: "faq-12",
    question: "Is Leap Learners suitable for SATs and 11+ preparation?",
    answer:
      "Yes. Our programme builds strong foundations across all topics, helping children feel confident and prepared for both school assessments and entrance exams.",
  },
  {
    id: "faq-13",
    question: "How much does Leap Learners cost?",
    answer:
      "Our self directed platform costs £29.99 for up to 5 children. Guided Learning costs £69.99 for one child, and £40 for each extra child.",
  },
];

const categories = [
  {
    label: "About the Platform",
    ids: ["faq-1", "faq-2", "faq-3", "faq-4"],
  },
  {
    label: "For Students & Parents",
    ids: [
      "faq-5",
      "faq-6",
      "faq-7",
      "faq-8",
      "faq-9",
      "faq-10",
      "faq-11",
      "faq-12",
    ],
  },
  { label: "Pricing", ids: ["faq-13"] },
];

export default function FaqsPage() {
  const faqMap = Object.fromEntries(faqs.map((f) => [f.id, f]));

  return (
    <div className="bg-bgWhiteGray min-h-screen flex flex-col">
      {/* ── Blue header ── */}
      <div className="bg-primaryBlue rounded-b-[2.5rem]">
        <div className="max-w-screen-2xl mx-auto text-white">
          <SiteNav active="faq" />
          <div className="text-center py-7 md:py-10 px-4">
            <p className="text-[#BBD0FF] font-semibold font-geist uppercase text-xs tracking-[0.2em] mb-2">
              Got questions?
            </p>
            <h1 className="font-geist font-semibold text-2xl md:text-3xl lg:text-4xl leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-blue-100 font-geist font-medium text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed">
              Can't find what you're looking for? Email us at{" "}
              <a
                href="mailto:leaplearners@yahoo.com"
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                leaplearners@yahoo.com
              </a>{" "}
              and we'll respond as soon as we can.
            </p>
          </div>
        </div>
      </div>

      {/* ── FAQ sections ── */}
      <div className="flex-1 max-w-screen-md mx-auto w-full px-4 md:px-8 py-16 md:py-24 space-y-14">
        {categories.map(({ label, ids }) => (
          <div key={label}>
            <h2 className="text-primaryBlue font-semibold font-geist uppercase text-xs tracking-[0.2em] mb-5">
              {label}
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {ids.map((id) => {
                const faq = faqMap[id];
                return (
                  <AccordionItem
                    key={id}
                    value={id}
                    className="bg-white rounded-2xl border border-gray-100 px-6 shadow-sm data-[state=open]:shadow-md data-[state=open]:border-primaryBlue/20 transition-all duration-200"
                  >
                    <AccordionTrigger className="text-left font-semibold font-geist text-gray-900 text-base py-5 hover:no-underline hover:text-primaryBlue transition-colors [&[data-state=open]]:text-primaryBlue">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-textSubtitle font-medium font-geist text-sm leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}

        {/* ── Still have questions CTA ── */}
        <div className="bg-primaryBlue rounded-2xl p-8 md:p-10 text-white text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold font-geist text-xl mb-1">
              Still have questions?
            </h3>
            <p className="text-blue-100 font-geist font-medium text-sm leading-relaxed">
              We're happy to help. Send us an email and we'll get back to you
              as soon as possible.
            </p>
          </div>
          <Link
            href="mailto:leaplearners@yahoo.com"
            className="mt-2 bg-white text-primaryBlue font-semibold font-geist rounded-full px-7 py-3 text-sm hover:bg-blue-50 transition-colors shadow-sm"
          >
            leaplearners@yahoo.com
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
