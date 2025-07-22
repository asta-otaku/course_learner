"use client";

import Features from "@/components/home/features";
import Footer from "@/components/home/footer";
import Hero from "@/components/home/hero";
import Testimonials from "@/components/home/testimonials";
import WhyWeAreBest from "@/components/home/whyWeAreBest";

export default function Home() {
  return (
    <div className="bg-bgWhiteGray">
      <Hero />
      <WhyWeAreBest />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
}
