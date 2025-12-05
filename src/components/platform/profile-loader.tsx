"use client";

import React from "react";
import Image from "next/image";

export default function ProfileLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo with fade-in animation */}
        <div className="animate-pulse">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={0}
            height={0}
            className="w-32 h-auto"
            priority
          />
        </div>

        {/* Loading spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          Switching profile...
        </p>
      </div>
    </div>
  );
}
