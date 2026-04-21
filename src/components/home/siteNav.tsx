"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";

interface SiteNavProps {
  active?: "about" | "contact" | "faqs";
}

export default function SiteNav({ active }: SiteNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLink = (
    href: string,
    label: string,
    key: "about" | "contact" | "faqs"
  ) => {
    const isActive = active === key;
    return (
      <Link
        href={href}
        className={`font-medium font-geist transition-colors ${
          isActive
            ? "text-white border-b-2 border-white/60"
            : "hover:text-blue-200"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="relative flex justify-between items-center py-6 px-4 md:px-8 lg:px-12 xl:px-16">
      <Link href="/">
        <Image
          src="/white-logo.svg"
          alt="Leap Learners"
          width={0}
          height={0}
          className="w-20 md:w-24 h-auto"
        />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {navLink("/about", "About Us", "about")}
        {navLink("/faqs", "FAQ", "faqs")}
        {navLink("/contact", "Contact Us", "contact")}
      </div>

      {/* Desktop buttons */}
      <div className="hidden md:flex items-center gap-4">
        <Button
          asChild
          className="bg-primaryBlue text-white border-2 border-white/30 rounded-full w-[120px] py-5 shadow-demoShadow hover:bg-blue-700 transition-colors"
        >
          <Link href="/sign-up">Register</Link>
        </Button>
        <Button
          asChild
          className="bg-demo-gradient border-2 border-white/30 text-white rounded-full w-[120px] py-5 shadow-demoShadow hover:opacity-90 transition-opacity"
        >
          <Link href="/sign-in">Login</Link>
        </Button>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-[-1rem] right-[-1rem] md:hidden bg-primaryBlue border-t border-white/20 z-50 rounded-b-[2.5rem]">
          <div className="px-4 py-6 space-y-4">
            <div className="space-y-4">
              <Link
                href="/about"
                className={`block font-medium font-geist transition-colors ${active === "about" ? "text-white" : "hover:text-blue-200"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/faqs"
                className={`block font-medium font-geist transition-colors ${active === "faqs" ? "text-white" : "hover:text-blue-200"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className={`block font-medium font-geist transition-colors ${active === "contact" ? "text-white" : "hover:text-blue-200"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/20">
              <Button
                asChild
                className="bg-primaryBlue text-white border-2 border-white/30 rounded-full py-3 shadow-demoShadow hover:bg-blue-700"
              >
                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                  Register
                </Link>
              </Button>
              <Button
                asChild
                className="bg-demo-gradient text-white rounded-full py-3 shadow-demoShadow hover:opacity-90"
              >
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
