import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, BookOpen, ClipboardList } from "lucide-react";
import { BackButton } from "@/components/not-found-back-button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-bgWhiteGray">
      {/* Leap Learner header strip */}
      <header className="bg-primaryBlue w-full py-4 px-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto flex justify-center md:justify-start">
          <Link href="/" className="inline-block">
            <Image
              src="/white-logo.svg"
              alt="Leap Learner"
              width={0}
              height={0}
              className="w-20 md:w-24 h-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-16">
        <div className="max-w-lg w-full text-center">
          {/* Illustration - friendly "lost" / learning vibe */}
          <div className="flex justify-center mb-6">
            <Image
              src="/boy-one.svg"
              alt=""
              width={160}
              height={160}
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-sm"
              aria-hidden
            />
          </div>

          {/* Playful 404 */}
          <p
            className="text-6xl md:text-7xl font-bold font-gorditas text-primaryBlue select-none"
            aria-hidden
          >
            404
          </p>
          <h1 className="text-xl md:text-2xl font-semibold text-textGray mt-2 font-geist">
            Oops! This page is playing hide and seek.
          </h1>
          <p className="text-textSubtitle text-sm md:text-base mt-3 max-w-sm mx-auto font-geist">
            We couldn&apos;t find it in our syllabus. No worries — let&apos;s
            get you back to learning.
          </p>

          {/* Primary actions - Leap Learner button style */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              asChild
              className="bg-demo-gradient text-white border-2 border-white/30 rounded-full px-6 py-5 shadow-demoShadow hover:opacity-90 transition-opacity font-medium"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <BackButton />
          </div>

          {/* Looking for lessons or quizzes - kept, Leap Learner style */}
          <div className="mt-10 p-4 rounded-2xl bg-white border border-primaryBlue/15 shadow-sm max-w-md mx-auto">
            <p className="text-sm font-medium text-textGray font-geist flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primaryBlue" />
              Looking for lessons or quizzes?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primaryBlue/10 text-primaryBlue hover:bg-primaryBlue/20 font-medium text-sm transition-colors"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primaryBlue/10 text-primaryBlue hover:bg-primaryBlue/20 font-medium text-sm transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Library
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
