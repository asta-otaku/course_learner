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
            Start 10 Days Trial
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
            Start 10 Days Trial
          </Button>
        </div>
      </div>
      <div className="bg-blue-500 w-full min-h-[254px] flex items-center rounded-3xl mt-16 relative overflow-hidden">
        {/* Background math symbols - centered absolutely */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{
            backgroundImage: `url('/always-wth.png')`,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        {/* Content overlay */}
        <div className="relative z-10 flex items-center justify-between h-full px-4 md:px-8 py-4 w-full">
          {/* Left side content */}
          <div className="text-white max-w-2xl z-10">
            <h6 className="text-[#BBD0FF] font-semibold font-geist">
              VIGINTI QUATTUOR/SEPTEM SUPPORTUS
            </h6>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-geist font-semibold my-5">
              SEMPER CUM TE
            </h1>

            <div className="space-y-3 ">
              <div className="flex items-center gap-3">
                <BadgeCheck className="fill-white w-4 h-4 text-primaryBlue shrink-0" />
                <p className="leading-relaxed font-geist font-medium">
                  Quisque Emptor Est Positus In Parvus Supportus Group
                </p>
              </div>

              <div className="flex items-center gap-3">
                <BadgeCheck className="fill-white w-4 h-4 text-primaryBlue shrink-0" />
                <p className="leading-relaxed font-geist font-medium">
                  Tu Potes Rogo Quaestio In Quisque Worksheet, Video, Vel Mock
                  Charta Tu Es Haereo In Tu Non Habebis Quisque Quaestiones
                  Tamen Quia Platform Est Tam Bonus
                </p>
              </div>
            </div>
          </div>
          <Image
            src={alwaysWithYou}
            alt="Happy student"
            width={0}
            height={0}
            className="w-fit h-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden xl:block opacity-90"
          />

          {/* Right side boy illustration */}
          <div className="flex-shrink-0 ml-8 hidden xl:block">
            <Image
              src="/straight-boy.svg"
              alt="Happy student"
              width={0}
              height={0}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
