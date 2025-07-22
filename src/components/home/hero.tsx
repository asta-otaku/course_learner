"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

function Hero() {
  const { push } = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="bg-primaryBlue w-full relative">
      <div className="max-w-screen-2xl mx-auto text-white">
        {/* Header */}
        <div className="flex justify-between items-center py-6 px-4 md:px-8 lg:px-12 xl:px-16">
          <Link href="/">
            <Image
              src="/white-logo.svg"
              alt="Logo"
              width={0}
              height={0}
              className="w-20 md:w-24 h-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#about"
              className="font-medium font-geist hover:text-blue-200 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="#faq"
              className="font-medium font-geist hover:text-blue-200 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="#contact"
              className="font-medium font-geist hover:text-blue-200 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={() => push("/sign-up")}
              className="bg-primaryBlue text-white border-2 border-white/30 rounded-full w-[120px] py-5 shadow-demoShadow hover:bg-blue-700 transition-colors"
            >
              Register
            </Button>
            <Button
              onClick={() => push("/sign-in")}
              className="bg-demo-gradient border-2 border-white/30 text-white rounded-full w-[120px] py-5 shadow-demoShadow hover:opacity-90 transition-opacity"
            >
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primaryBlue border-t border-white/20">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-4">
                <Link
                  href="#about"
                  className="block font-medium font-geist hover:text-blue-200 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link
                  href="#faq"
                  className="block font-medium font-geist hover:text-blue-200 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link
                  href="#contact"
                  className="block font-medium font-geist hover:text-blue-200 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact Us
                </Link>
              </div>

              {/* Mobile Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/20">
                <Button
                  onClick={() => {
                    push("/sign-up");
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-primaryBlue text-white border-2 border-white/30 rounded-full py-3 shadow-demoShadow hover:bg-blue-700 transition-colors"
                >
                  Register
                </Button>
                <Button
                  onClick={() => {
                    push("/sign-in");
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-demo-gradient text-white rounded-full py-3 shadow-demoShadow hover:opacity-90 transition-opacity"
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
          <Image
            src="/heroImage.svg"
            alt="Hero"
            width={0}
            height={0}
            className="w-full h-auto max-w-md md:max-w-none z-10"
          />
          <h2 className="text-center text-xl md:text-2xl lg:text-3xl xl:text-[40px] font-geist font-semibold max-w-[820px] leading-tight md:leading-tight w-full capitalize mt-8 md:mt-12 z-10">
            Master the entire KS2/11+ Maths syllabus using our animated videos,
            worksheets and mock papers!
          </h2>
          <p className="font-geist text-sm md:text-base lg:text-lg xl:text-xl my-4 md:my-6 text-center px-4 z-10">
            Immerse your child in our ordered,
            <br className="hidden sm:block" /> animated platform.
          </p>

          <Button
            onClick={() => push("/sign-up")}
            className="bg-demo-gradient border-2 border-white/30 text-white rounded-full w-[180px] md:w-[200px] py-4 md:py-5 shadow-demoShadow mt-8 md:mt-12 hover:opacity-90 transition-opacity z-10"
          >
            Start 10 Days Trials
          </Button>
        </div>
      </div>
      <Image
        src="/bubble.svg"
        alt="Hero"
        width={0}
        height={0}
        className="w-full h-auto absolute -bottom-[4.5%] md:-bottom-[6%] lg:-bottom-[8.2%] 2xl:-bottom-[9.6%] left-0 right-0"
      />
    </div>
  );
}

export default Hero;
