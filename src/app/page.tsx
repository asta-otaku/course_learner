"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isUserTypeAuthenticated,
  getAndClearIntendedUrl,
} from "@/lib/services/axiosInstance";
import Features from "@/components/home/features";
import Footer from "@/components/home/footer";
import Hero from "@/components/home/hero";
import Testimonials from "@/components/home/testimonials";
import WhyWeAreBest from "@/components/home/whyWeAreBest";

export default function Home() {
  const router = useRouter();

  // Check if user is already signed in and redirect to appropriate dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for intended URL first
    const intendedUrl = getAndClearIntendedUrl();

    // Check authentication in order: admin, tutor, user
    if (isUserTypeAuthenticated("user")) {
      router.push(intendedUrl || "/dashboard");
    } else if (isUserTypeAuthenticated("tutor")) {
      router.push(intendedUrl || "/tutor");
    } else if (isUserTypeAuthenticated("admin")) {
      router.push(intendedUrl || "/admin");
    }
  }, [router]);

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
