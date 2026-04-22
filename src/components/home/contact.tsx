"use client";

import { Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import SiteNav from "./siteNav";
import Footer from "./footer";

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: "leaplearners@yahoo.com",
    description:
      "Drop us a message and we'll get back to you as soon as possible.",
    href: "mailto:leaplearners@yahoo.com",
    cta: "Send an email",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+44 7424 691577",
    description:
      "Prefer to chat? Reach us directly on WhatsApp for a faster response.",
    href: "https://wa.me/447424691577",
    cta: "Message on WhatsApp",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-bgWhiteGray min-h-screen flex flex-col">
      {/* ── Blue header ── */}
      <div className="bg-primaryBlue rounded-b-[2.5rem]">
        <div className="max-w-screen-2xl mx-auto text-white">
          <SiteNav active="contact" />
          <div className="text-center py-7 md:py-10 px-4">
            <p className="text-[#BBD0FF] font-semibold font-geist uppercase text-xs tracking-[0.2em] mb-2">
              Get in touch
            </p>
            <h1 className="font-geist font-semibold text-2xl md:text-3xl lg:text-4xl leading-tight">
              Contact Us
            </h1>
          </div>
        </div>
      </div>

      {/* ── Contact section ── */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 lg:px-12 py-16 md:py-24">
        {/* Intro */}
        <div className="max-w-xl mx-auto text-center mb-12 md:mb-16">
          <p className="text-textSubtitle font-medium font-geist text-base md:text-lg leading-relaxed">
            For enquiries, feedback or complaints, you can reach out to us via
            any of the channels below. We aim to respond within 24 hours.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {channels.map(({ icon: Icon, label, value, description, href, cta }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6 hover:shadow-md hover:border-primaryBlue/20 transition-all duration-200"
            >
              {/* Icon + label row */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-demo-gradient flex items-center justify-center shadow-demoShadow shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-primaryBlue font-semibold font-geist uppercase text-xs tracking-[0.15em]">
                  {label}
                </p>
              </div>

              {/* Contact value */}
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-gray-900 font-geist text-lg md:text-xl">
                  {value}
                </p>
                <p className="text-textSubtitle font-medium font-geist text-sm leading-relaxed">
                  {description}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-primaryBlue font-semibold font-geist text-sm mt-auto group-hover:gap-2.5 transition-all duration-150">
                {cta}
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
