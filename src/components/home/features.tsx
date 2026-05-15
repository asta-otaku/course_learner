import React from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import alwaysWithYou from "@/assets/always-with.png";

function Features() {
  const { push } = useRouter();

  return (
    <div className="py-16 max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="flex flex-col justify-center items-center md:grid md:grid-cols-2 gap-4">
        <div className="rounded-lg p-4 mt-0 md:mt-28 flex flex-col gap-4">
          <h2 className="text-primaryBlue font-semibold uppercase font-geist">
            Nostra Facultates
          </h2>
          <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl uppercase">
            Animus Videos
          </h1>
          <p className="text-textSubtitle font-medium font-geist max-w-md capitalize">
            Nostra centum triginta plus brevis animus videos operio omnis topic
            in KS2 et undecim plus Mathematica syllabus.
          </p>
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0" />
              <p className="text-sm md:text-base font-geist text-textSubtitle capitalize font-medium">
                Quisque video aedifico super contentus in praecedo videos ad
                optimus discere.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0" />
              <p className="text-sm md:text-base font-geist text-textSubtitle capitalize font-medium">
                Videos sunt valde facilis pro te et tuus puer sequi.
              </p>
            </div>
          </div>
          <Button
            onClick={() => push("/sign-in")}
            className="bg-demo-gradient shadow-demoShadow w-fit md:w-[180px] text-white rounded-full px-6 py-4 mt-5"
          >
            Get Started
          </Button>
        </div>
        <Image
          src="/animated-video.svg"
          alt="Animated Video"
          width={0}
          height={0}
          className="w-full h-auto"
        />
      </div>

      <div className="flex flex-col justify-center items-center md:grid md:grid-cols-2 gap-4 mt-5">
        <Image
          src="/quiz-section.svg"
          alt="Quiz Section"
          width={0}
          height={0}
          className="w-full h-auto"
        />
        <div className="rounded-lg p-4 mt-0 md:mt-12 flex flex-col h-full justify-center gap-4">
          <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl uppercase font-geist">
            Quaestio
          </h1>
          <p className="text-textSubtitle font-medium font-geist max-w-md capitalize">
            Semel tuus puer habeo confectus video, nos habeo singulus worksheets
            ad penitus test tuus puer rectus post, ut illi active recordor quid
            illi habeo modo didici.
          </p>
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0" />
              <p className="text-sm md:text-base font-geist text-textSubtitle capitalize font-medium">
                Nos habeo analysatus milia praeteritus charta quaestiones pro
                quisque topic, ad certus worksheets sunt usque ad exam standard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-[22px] h-[22px] text-white fill-primaryBlue shrink-0" />
              <p className="text-sm md:text-base font-geist text-textSubtitle capitalize font-medium">
                Nos habeo valde singulus solutiones quoque. Nos non modo do
                responsum, nos explico quomodo advenio ad id!
              </p>
            </div>
          </div>
          <Button
            onClick={() => push("/sign-in")}
            className="bg-demo-gradient shadow-demoShadow w-fit md:w-[180px] text-white rounded-full px-6 py-4 mt-5"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Features;
