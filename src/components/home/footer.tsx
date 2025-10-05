import Image from "next/image";
import React from "react";

function Footer() {
  return (
    <div>
      <div className="py-16 max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 flex flex-col md:flex-row gap-6 justify-between items-start bg-bgWhiteGray">
        <div className="space-y-2">
          <Image
            src="/logo.svg"
            alt="logo"
            width={0}
            height={0}
            className="w-20 h-auto"
          />
          <p className="text-textSubtitle font-medium">
            A Mathematica experientia tu numquam obliviscor!
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-2">
            <h1 className="text-primaryBlue font-medium mb-2 uppercase">
              Facultas
            </h1>
            <span className="text-textSubtitle font-medium text-xs">
              Videos
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Worksheets
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Exam Charta
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-primaryBlue font-medium mb-2 uppercase">
              Supportus
            </h1>
            <span className="text-textSubtitle font-medium text-xs">
              Videos
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Worksheets
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Exam Charta
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-primaryBlue font-medium mb-2 uppercase">
              Societas
            </h1>
            <span className="text-textSubtitle font-medium text-xs">
              Videos
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Worksheets
            </span>
            <span className="text-textSubtitle font-medium text-xs">
              Exam Charta
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-screen-2xl w-full h-[270px] overflow-hidden relative mx-auto">
        <Image
          src="/footer-kids.svg"
          alt="logo"
          width={0}
          height={0}
          className="w-full h-[270px] object-cover object-top"
        />
      </div>
    </div>
  );
}

export default Footer;
