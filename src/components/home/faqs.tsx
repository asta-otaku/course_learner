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
    question: "Quid est Leap Learners?",
    answer:
      "Leap Learners est platform digitalis quae discipulis auxilium mathematicum praebet. Per videos animatos, quaestiones interactivas et sessiones cum tutore privato, nos certamus ut omnes pueri veram intellectum mathematicae acquirere possint — non solum memorisationem.",
  },
  {
    id: "faq-2",
    question: "Quid Leap Learners ab aliis diversum facit?",
    answer:
      "Nos non solum responsa damus — nos explicamus cur. Quaeque conceptus ex fundamentis aedificatur, ita discipuli non solum sciant quid faciant, sed etiam quomodo et cur. Praeterea, omnes contenta a mathematico et ingeniario programmandi creata sunt, qui etiam ut tutor privatus laborat.",
  },
  {
    id: "faq-3",
    question: "Sequiturne Leap Learners curriculum nationale?",
    answer:
      "Ita vero. Omnia contenta nostra ad curriculum nationale KS2 et syllabus 11+ et SATs accommodata sunt. Quaeque topic secundum ordinem logicum praesentatur, ita nullum hiatus in cognitione discipuli relinquitur.",
  },
  {
    id: "faq-4",
    question: "Num Leap Learners discipulum meum vere adiuvabit?",
    answer:
      "Hoc ex discipulo et ex quantitate temporis quod in platform expendit dependet. Multi discipuli nostri progressum significativum intra paucas hebdomades viderunt. Praecipua causa est quod nos non solum exercitationes damus — nos intellectum verum aedificamus.",
  },
  {
    id: "faq-5",
    question: "Quam aetatem habet discipulus ad Leap Learners utendum?",
    answer:
      "Platform nostra maxime pro discipulis inter annos septem et tredecim designata est (KS2, SATs et 11+). Tamen etiam discipuli iuniores aut seniores beneficium capere possunt, praesertim si basis mathematica firmanda est.",
  },
  {
    id: "faq-6",
    question: "Discipulus meus aliquam basim habet — unde incipimus?",
    answer:
      "Optimus locus incipere est cum 'baseline test' nostro, qui cognitionem currentem discipuli metitur et iter personale recommendat. Ita tempus non teritur in his quae discipulus iam scit, et focus in lacunis ponitur.",
  },
  {
    id: "faq-7",
    question: "Potestne discipulus meus Leap Learners solus uti?",
    answer:
      "Ita. Platform nostra sic designata est ut discipuli independenter progredi possint — videos, quaestiones et feedback automaticum eis ducent. Nihilominus, sessiones cum tutore privato magnum complementum praebent pro discipulis qui plus auxilii desiderant.",
  },
  {
    id: "faq-8",
    question: "Quomodo vos recommendatis nos platform uti?",
    answer:
      "Recommendamus ut discipuli tres vel quattuor vices per hebdomadem in platform laborent. Optimum iter est: primo video spectare, deinde quaestiones facere, et postea errores diligenter revolvere. Sessio hebdomadalis cum tutore progressum consolidare adiuvat.",
  },
  {
    id: "faq-9",
    question: "Quantum Leap Learners constat?",
    answer:
      "Habemus varias optiones subscriptionis pro familiis diversis. Pro pretio recenti et informatione de trialo gratuito decem dierum, vide paginam pretii nostrae vel scribe ad leaplearners@yahoo.com.",
  },
  {
    id: "faq-10",
    question: "Discipulus meus lacunas in cognitione habet. Potestne Leap Learners hoc solvere?",
    answer:
      "Hoc est praecise quod nos optime facimus. Per 'baseline test' nostrum, lacunas in cognitione discipuli identificamus et iter personale creamus. Ita discipulus ex fundamentis aedificat et numquam aliquid necessarium praetermittit.",
  },
];

const categories = [
  { label: "About the Platform", ids: ["faq-1", "faq-2", "faq-3"] },
  { label: "For Students & Parents", ids: ["faq-4", "faq-5", "faq-6", "faq-7", "faq-8"] },
  { label: "Pricing & Getting Started", ids: ["faq-9", "faq-10"] },
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
