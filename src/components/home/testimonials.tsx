import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TRUSTPILOT_REVIEW_URL = "https://www.trustpilot.com/review/leaplearners.com";
const TRUSTPILOT_RATING_OUT_OF_5 = 4.5;

function TrustpilotStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div className={["flex items-center gap-1", className].join(" ")}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        const fillPercent = `${Math.round(fill * 100)}%`;

        return (
          <span
            key={i}
            className="relative h-4 w-4 rounded-[2px] bg-[#DCDCE6] overflow-hidden flex items-center justify-center"
            aria-hidden="true"
          >
            <span
              className="absolute inset-y-0 left-0 bg-[#00B67A]"
              style={{ width: fillPercent }}
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
                fill="white"
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

const testimonials = [
  {
    name: "Funmi",
    text: "I love the fact that I am able to watch the videos alongside my child. I learnt a lot too and the quality of the videos are excellent.",
    imageSrc: undefined as string | undefined,
  },
  {
    name: "Amanda",
    text: "The course really worked for my son! He’s just finished yr 5 and started the course aged 9, so hadn’t any previous algebra teaching. I confess, I left him to do the course on his own while I worked, fortunately he’s quite focused and keen to learn.",
    imageSrc: undefined as string | undefined,
  },
  {
    name: "Julian",
    text: "The quality of the videos are very good and as someone personally involved in technology start ups I’m always impressed by entrepreneurial innovation.",
    imageSrc: undefined as string | undefined,
  },
  {
    name: "Munayah",
    text: "I just wanted to say a huge thank you for all your help – you are very much a part of her amazing success story. I hope you go on ahead with your product, which I believe will be a great arsenal for kids to excel at the 11 plus!",
    imageSrc: undefined as string | undefined,
  },
];

const miniFaqs = [
  {
    id: "mini-faq-1",
    question: "What if my child doesn’t stay consistent?",
    answer:
      "That’s exactly why many parents choose Guided Learning. Your child is given structured weekly work, and a Personal Buddy ensures they stay on track with reminders, feedback, and ongoing support.",
  },
  {
    id: "mini-faq-2",
    question: "Do I need to sit with my child while they use it?",
    answer:
      "No. The platform is designed for independent use. If you choose Guided Learning, everything is handled for you — from assigning work to tracking progress — so you don’t have to manage it yourself.",
  },
  {
    id: "mini-faq-3",
    question: "Is this better than a tutor?",
    answer:
      "Leap Learners combines the structure of tutoring with the flexibility of an online platform. Your child gets clear teaching, regular practice, and support when needed — without relying on fixed weekly sessions.",
  },
  {
    id: "mini-faq-4",
    question: "What happens if my child gets stuck?",
    answer:
      "They’ll receive clear explanations through the videos, and if they still need help, they can message their Learning Buddy or book a 1-to-1 session for extra support.",
  },
  {
    id: "mini-faq-5",
    question: "Will this actually help my child improve?",
    answer:
      "Yes. When used consistently, children build strong foundations, close gaps, and develop confidence across all topics — whether they’re catching up or aiming to excel.",
  },
  {
    id: "mini-faq-6",
    question: "Is this suitable for my child’s level?",
    answer:
      "Yes. The platform covers Years 1–6 and adapts to your child’s level. In Guided Learning, we assess their starting point and tailor the work accordingly.",
  },
  {
    id: "mini-faq-7",
    question: "Do you prepare children for SATs and 11+?",
    answer:
      "Yes. We focus on building strong understanding across all topics, which naturally prepares children for school assessments, SATs, and 11+ exams.",
  },
];

function MiniFaq() {
  return (
    <div className="w-full py-20 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.3fr] gap-10 items-start max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="space-y-2">
          <h3 className="text-black font-geist font-semibold text-2xl md:text-3xl leading-tight">
            STILL HAVE
            <br />
            <span className="text-primaryBlue">QUESTIONS?</span>
          </h3>
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="mini-faq-1"
          className="space-y-3"
        >
          {miniFaqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-bgOffwhite rounded-2xl px-6 shadow-sm data-[state=open]:shadow-md data-[state=open]:border-primaryBlue/20 transition-all duration-200"
            >
              <AccordionTrigger
                iconVariant="plusMinus"
                className="text-left font-semibold font-geist text-gray-900 text-sm md:text-base py-3 hover:no-underline hover:text-primaryBlue transition-colors"
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-textSubtitle font-medium font-geist text-sm leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

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
      type="button"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-primaryBlue text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={direction === "left" ? "Previous testimonials" : "Next testimonials"}
      onClick={onClick}
      disabled={disabled}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d={
            direction === "left"
              ? "M15 18l-6-6 6-6"
              : "M9 6l6 6-6 6"
          }
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Testimonials() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canGoLeft, setCanGoLeft] = useState(false);
  const [canGoRight, setCanGoRight] = useState(true);

  const updateButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanGoLeft(el.scrollLeft > 0);
    setCanGoRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  const scrollByCards = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    updateButtons();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateButtons);
    };
  }, []);

  const heading = useMemo(
    () => (
      <div className="space-y-2">
        <h2 className="text-primaryBlue font-semibold uppercase font-geist text-sm tracking-wider">
          Testimonials
        </h2>
        <div className="text-2xl md:text-3xl font-semibold text-black">
          Our Customers Say{" "}
          <span className="text-[#00B67A]">Excellent</span>
        </div>
        <a
          href={TRUSTPILOT_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 text-[11px] text-textSubtitle"
        >
          <TrustpilotStars rating={TRUSTPILOT_RATING_OUT_OF_5} />
          <span className="text-black font-medium">
            {TRUSTPILOT_RATING_OUT_OF_5} Out Of 5 Based {testimonials.length}{" "}
            Reviews
          </span>
          <span
            className="h-3.5 w-3.5 text-[#00B67A] inline-flex items-center justify-center"
            aria-hidden="true"
          >
            ★
          </span>
          <span className="font-medium text-black">Trustpilot</span>
        </a>
      </div>
    ),
    [],
  );

  return (
    <div className="py-16">
      <div className="flex items-start justify-between gap-6 mb-8 max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
        {heading}
        <div className="flex gap-3 pt-2">
          <Arrow
            direction="left"
            onClick={() => scrollByCards("left")}
            disabled={!canGoLeft}
          />
          <Arrow
            direction="right"
            onClick={() => scrollByCards("right")}
            disabled={!canGoRight}
          />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="w-full overflow-x-auto scrollbar-hide scroll-smooth max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 pb-20"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex gap-6 pb-2">
          {testimonials.map((t, idx) => (
            <a
              key={idx}
              href={TRUSTPILOT_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-2xl overflow-hidden shadow-md bg-[#f2f2f2] flex flex-col justify-end flex-shrink-0 h-80 w-[85%] sm:w-[60%] md:w-[45%] lg:w-[24%]"
              style={{ scrollSnapAlign: "start" }}
            >
              {t.imageSrc ? (
                <Image
                  src={t.imageSrc}
                  alt={`${t.name} testimonial`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 45vw, 85vw"
                  className="absolute inset-0 object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
              <div className="relative p-5 text-white">
                <div className="text-sm font-semibold">{t.name}</div>
                <p className="text-xs mt-2 leading-snug line-clamp-5">
                  “{t.text}”
                </p>
                <div className="flex items-center justify-between mt-4">
                  <TrustpilotStars
                    rating={TRUSTPILOT_RATING_OUT_OF_5}
                    className="scale-[0.85] origin-left"
                  />
                  <span className="text-white/90 text-xs font-semibold">
                    Read more →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <MiniFaq />

      <PricingSection />
    </div>
  );
}

function PricingSection() {
  const { push } = useRouter();

  const goSignIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    push("/sign-in");
  };

  const platformFeatures = [
    "Full access to 147+ animated maths lessons",
    "Interactive quizzes for every topic",
    "Personal dashboard to track progress",
    "Search any topic instantly with the glossary",
  ];

  const guidedLearningFeatures: Array<{ text: string; emphasis?: boolean }> = [
    { text: "Personal Learning Buddy to guide your child" },
    { text: "Baseline assessment to identify gaps" },
    { text: "Structured weekly assignments (with lesson videos)" },
    { text: "Feedback provided on completed work" },
    { text: "Direct messaging support when needed" },
    { text: "Bookable 1-to-1 video sessions" },
    { text: "Full platform access included", emphasis: true },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-20 pt-52">
      <div
        className="rounded-3xl relative overflow-visible min-h-[600px] flex flex-col items-center justify-start mx-auto z-10"
        style={{
          background: `linear-gradient(to bottom, #286CFF, #286CFF40 60%, #f5f5f5 100%)`,
        }}
      >
        {/* Anime Images */}
        <div className="absolute -top-[92px] left-4 md:left-8 z-20 h-[94px] w-[120px] overflow-hidden pointer-events-none">
          <Image
            src="/pricing-boy.svg"
            alt="boy"
            width={120}
            height={120}
            className="select-none"
            priority
          />
        </div>

        {/* Header */}
        <h3 className="text-white font-geist font-semibold text-center mt-14">
          OUR PRICING
          <br />
          AND SUBSCRIPTIONS
        </h3>
        <div className="h-10" />
        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8 w-full max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-1.5 pb-24 flex-1 max-w-[380px] w-full">
            <div className="bg-primaryBlue p-4 text-white rounded-xl font-geist space-y-4">
              <h2 className="font-semibold">THE PLATFORM</h2>
              <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">
                £29.99
              </h1>
              <p className="text-xs font-semibold text-[#5FBCFF] font-geist">
                10 DAYS FREE TRIAL INCLUDED
              </p>
              <button onClick={goSignIn} className="bg-demo-gradient w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold">
                Get Started
              </button>
            </div>
            <div className="flex h-8 items-center justify-center relative my-5">
              <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0"></div>
              <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
                THE PLATFORM INCLUDES
              </h2>
            </div>
            <ul className="space-y-3 mb-12 px-2">
              {platformFeatures.map((text, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-xs text-textSubtitle font-geist"
                >
                  <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 text-xs text-textSubtitle font-geist">
                <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                <span className="font-semibold">
                  Up to 5 child profiles included (one subscription)
                </span>
              </li>
            </ul>

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
            <div className="bg-white rounded-2xl shadow-lg p-1.5 pb-24 flex-1 z-50 w-full">
              <div className="bg-bgWhiteGray p-4 text-textGray rounded-xl font-geist space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">GUIDED LEARNING</h2>
                  <span className="shrink-0 rounded-full bg-black text-white px-3 py-1 text-[10px] font-semibold">
                    Most Popular
                  </span>
                </div>
                <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">
                  £69.99
                </h1>
                <p className="text-xs font-semibold text-textSubtitle font-geist">
                  10 DAYS FREE TRIAL INCLUDED
                </p>
                <button onClick={goSignIn} className="bg-demo-gradient text-white w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold">
                  Get Started
                </button>
              </div>
              <div className="flex h-8 items-center justify-center relative my-5">
                <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0"></div>
                <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
                  GUIDED LEARNING INCLUDES
                </h2>
              </div>
              <ul className="space-y-3 mb-12 px-2">
                {guidedLearningFeatures.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-xs text-textSubtitle font-geist"
                  >
                    <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                    <span className={f.emphasis ? "font-semibold" : undefined}>
                      {f.text}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-3 text-xs text-textSubtitle font-geist">
                  <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                  <span className="font-semibold">
                    Add up to 5 children on the platform (included)
                  </span>
                </li>
                <li className="flex items-center gap-3 text-xs text-textSubtitle font-geist">
                  <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
                  <span className="font-semibold">
                    Additional Guided Learning child: £40 each
                  </span>
                </li>
              </ul>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
