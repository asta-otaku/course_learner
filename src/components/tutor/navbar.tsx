"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
import LogoutIcon from "@/assets/svgs/logout";
import { getTutorUser } from "@/lib/services/axiosInstance";
import { logout } from "@/lib/services/axiosInstance";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { push } = useRouter();
  const [tutorUser, setTutorUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = getTutorUser();
      setTutorUser(user);
    }
  }, []);

  const routes = [
    { name: "Dashboard", path: "/tutor" },
    { name: "Students", path: "/tutor/students" },
    { name: "Homework", path: "/tutor/homework" },
    { name: "Learning Resources", path: "/tutor/learning-resources" },
    { name: "Messages", path: "/tutor/messages" },
    { name: "Sessions", path: "/tutor/sessions" },
  ];

  return (
    <nav className="bg-white w-full shadow-sm relative z-20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
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
        <div className="hidden md:flex gap-6 lg:gap-12 ml-8">
          {routes.map((route) => (
            <Link
              key={route.name}
              href={route.path}
              className={`font-medium text-sm md:text-base ${
                (
                  route.path === "/tutor"
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

        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center focus:outline-none cursor-pointer">
                <div className="w-10 h-10 bg-[#D9D9D9] rounded-full flex items-center justify-center overflow-hidden cursor-pointer">
                  <span className="text-gray-500 text-sm font-semibold">
                    {tutorUser?.data?.data?.firstName &&
                    tutorUser?.data?.data?.lastName
                      ? `${tutorUser.data.data.firstName[0]}${tutorUser.data.data.lastName[0]}`
                      : tutorUser?.data?.data?.name
                        ? tutorUser.data.data.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                        : tutorUser?.data?.firstName &&
                            tutorUser?.data?.lastName
                          ? `${tutorUser.data.firstName[0]}${tutorUser.data.lastName[0]}`
                          : "TU"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60 max-h-[80vh] overflow-auto scrollbar-hide p-1 mt-1 !rounded-xl shadow-lg"
              align="end"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <DropdownMenuItem
                onClick={() => push("/tutor/settings")}
                className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex gap-3 items-center"
              >
                <UserCircle className="text-gray-400" />
                Account Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => {
                  logout("tutor");
                }}
                className="px-3 py-2 text-sm cursor-pointer font-inter text-red-500 hover:bg-red-50 hover:text-red-600 rounded-sm flex gap-3 items-center"
              >
                <LogoutIcon />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-700 ml-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu (full‐height overlay) */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-inner absolute top-full left-0 w-full h-screen z-10">
          <div className="flex flex-col px-4 py-2 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.name}
                href={route.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 px-2 rounded-md font-medium text-sm ${
                  (
                    route.path === "/tutor"
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
