"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleHelp,
  Menu,
  PencilLine,
  Settings,
  UserCircle,
  X,
} from "lucide-react";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import LogoutIcon from "@/assets/svgs/logout";
import { useAuthGuard } from "../AuthGuard";
import { logout } from "@/lib/services/axiosInstance";
import ProfileLoader from "./profile-loader";

export default function Navbar() {
  const pathname = usePathname();
  const { push } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
    isChangingProfile,
  } = useSelectedProfile();
  const { isAuthenticated } = useAuthGuard();
  const [user, setUser] = React.useState<any>({});

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  const platformRoutes = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Library", path: "/library" },
    // { name: "Videos & Quiz", path: "/videos-quiz" },
    { name: "Glossary", path: "/glossary" },
  ];

  const tuitionRoutes = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Homework", path: "/homework" },
    { name: "Independent Learning", path: "/glossary" },
    { name: "Messages", path: "/messages" },
    { name: "Sessions", path: "/sessions" },
  ];

  const routes =
    user?.data?.offerType === "Offer One" ? platformRoutes : tuitionRoutes;

  if (!isAuthenticated) {
    return null;
  }

  if (!isLoaded) {
    return (
      <nav className="bg-white w-full shadow-sm relative z-20">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={0}
              height={0}
              className="w-24 h-auto"
            />
          </Link>
          <div className="flex-1" />
          <div
            className="w-10 h-10 bg-gray-200 rounded-full"
            id="loading-indicator"
          />
        </div>
      </nav>
    );
  }

  return (
    <>
      {isChangingProfile && <ProfileLoader />}
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
                  pathname.startsWith(route.path)
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
                      {activeProfile?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
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
                {profiles.map((profile, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => {
                      changeProfile(profile.name);
                      setIsProfileOpen(false);
                    }}
                    className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      <span className="text-gray-400 text-xs font-medium">
                        {profile.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {profile.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => push("/settings/profiles")}
                  className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex gap-3 ml-3 items-center"
                >
                  <PencilLine className="text-gray-400" />
                  Edit Profiles
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex gap-3 ml-3 items-center">
                  <UserCircle className="text-gray-400" />
                  Contact Us
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex gap-3 ml-3 items-center">
                  <CircleHelp className="text-gray-400" />
                  FAQ
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => push("/settings")}
                  className="px-3 py-2 text-sm cursor-pointer font-inter hover:bg-gray-100 rounded-sm flex gap-3 ml-3 items-center"
                >
                  <Settings className="text-gray-400" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("selectedProfile");
                      localStorage.removeItem("activeProfile");
                    }
                    push("/sign-in");
                  }}
                  className="px-3 py-2 text-sm cursor-pointer font-inter text-red-500 hover:bg-red-50 hover:text-red-600 rounded-sm flex gap-3 ml-3 items-center"
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
                    pathname === route.path
                      ? "bg-blue-50 text-blue-500"
                      : "text-gray-700 hover:bg-gray-100"
                  } transition`}
                >
                  {route.name}
                </Link>
              ))}

              <div className="mt-4 border-t pt-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-gray-500 text-sm font-semibold">
                    {activeProfile?.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
