"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const routes = [
    { name: "Dashboard", path: "/admin" },
    { name: "User Management", path: "/admin/user-management" },
    { name: "Session Management", path: "/admin/session-management" },
    { name: "Tutor Management", path: "/admin/tutor-management" },
    { name: "Timeslot Management", path: "/admin/timeslot-management" },
    { name: "Report & Analysis", path: "/admin/report-analysis" },
    { name: "Support & Feedback", path: "/admin/support-feedback" },
  ];

  return (
    <nav className="bg-white w-full shadow-sm relative z-20">
      <div className="max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
        {/* Logo */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.svg"
            alt="Logo"
            width={0}
            height={0}
            className="w-24 h-auto"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden xl:flex items-center gap-6 ml-8 w-full">
          {routes.map((route) => (
            <Link
              key={route.name}
              href={route.path}
              className={`font-medium text-sm whitespace-nowrap ${
                (
                  route.path === "/admin"
                    ? pathname === route.path
                    : pathname.startsWith(route.path)
                )
                  ? "text-blue-500"
                  : "text-textSubtitle"
              } hover:text-blue-500 transition`}
            >
              {route.name}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Mobile toggle */}
        <button
          className="xl:hidden p-2 text-gray-700 ml-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu (full‐height overlay) */}
      {mobileOpen && (
        <div className="xl:hidden bg-white border-t shadow-inner absolute top-full left-0 w-full h-screen z-10">
          <div className="flex flex-col px-4 py-2 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.name}
                href={route.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 px-2 rounded-md font-medium text-sm ${
                  (
                    route.path === "/admin"
                      ? pathname === route.path
                      : pathname.startsWith(route.path)
                  )
                    ? "bg-blue-50 text-blue-500"
                    : "text-gray-700 hover:bg-gray-100"
                } transition`}
              >
                {route.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
