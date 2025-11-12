"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  HelpCircle,
  BookOpen,
  Library,
  Plus,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/services/axiosInstance";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    userRole: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userData = JSON.parse(localStorage.getItem("admin") || "{}");
        if (!userData || !userData.data) {
          window.location.href = "/admin/sign-in";
        } else {
          setUser(userData.data);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        window.location.href = "/admin/sign-in";
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const displayName = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.lastName) {
      return user.lastName;
    }
    return "User";
  }, [user?.firstName, user?.lastName]);

  const navRole = user?.userRole;
  const isAdminOrTutor = navRole === "admin" || navRole === "tutor";

  // Main admin routes
  const routes = [
    { name: "Dashboard", path: "/admin" },
    { name: "User Management", path: "/admin/user-management" },
    { name: "Session Management", path: "/admin/session-management" },
    { name: "Tutor Management", path: "/admin/tutor-management" },
    { name: "Timeslot Management", path: "/admin/timeslot-management" },
    { name: "Report & Analysis", path: "/admin/report-analysis" },
    { name: "Support & Feedback", path: "/admin/support-feedback" },
  ];

  // Resource Management routes (for dropdown)
  const resourceManagementRoutes = [
    {
      name: "Questions",
      path: "/admin/questions",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      name: "Quizzes",
      path: "/admin/quizzes",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      name: "Curriculum",
      path: "/admin/curricula",
      icon: <Library className="w-4 h-4" />,
    },
  ];

  // Check if current path is a resource management route
  const isResourceManagementRoute = resourceManagementRoutes.some((route) =>
    pathname.startsWith(route.path)
  );

  const handleSignOut = async () => {
    logout("admin");
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin");
    }
  };

  // Don't render until user data is loaded
  if (isLoading || !user) {
    return (
      <nav className="bg-white w-full shadow-sm relative z-20">
        <div className="max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-0 2xl:px-24 py-4 flex items-center">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={0}
            height={0}
            className="w-24 h-auto"
          />
          <div className="ml-auto text-sm text-muted-foreground">
            Loading...
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white w-full shadow-sm relative z-20">
      <div className="max-w-screen-2xl w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
        {/* Logo */}
        <Link href="/admin" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.svg"
            alt="Logo"
            width={0}
            height={0}
            className="w-24 h-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-6 ml-8 w-full">
          {routes.map((route) => (
            <Link
              key={route.name}
              href={route.path}
              className={`font-medium text-sm whitespace-nowrap ${
                route.path === "/admin"
                  ? pathname === route.path
                  : pathname.startsWith(route.path)
                    ? "text-blue-500"
                    : "text-textSubtitle"
              } hover:text-blue-500 transition`}
            >
              {route.name}
            </Link>
          ))}

          {/* Resource Management Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`font-medium text-sm whitespace-nowrap flex items-center gap-1 ${
                  isResourceManagementRoute
                    ? "text-blue-500"
                    : "text-textSubtitle"
                } hover:text-blue-500 transition`}
              >
                Resource Management
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {resourceManagementRoutes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <Link
                    href={route.path}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {route.icon}
                    <span>{route.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1" />

        {/* Right side actions - Desktop */}
        <div className="hidden 2xl:flex items-center gap-2">
          {/* Quick Actions for Teachers/Admins */}
          {isAdminOrTutor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/admin/questions/new" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    New Question
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/quizzes/new" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    New Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/curricula/new" className="cursor-pointer">
                    <Library className="mr-2 h-4 w-4" />
                    New Curriculum
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500/10">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {navRole}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile toggle */}
        <button
          className="xl:hidden p-2 text-gray-700 ml-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu (full-height overlay) */}
      {mobileOpen && (
        <div className="xl:hidden bg-white border-t shadow-inner absolute top-full left-0 w-full h-screen z-10">
          <div className="flex flex-col px-4 py-2 space-y-1 max-h-screen overflow-y-auto">
            {/* Main routes */}
            {routes.map((route) => (
              <Link
                key={route.name}
                href={route.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 px-2 rounded-md font-medium text-sm ${
                  route.path === "/admin"
                    ? pathname === route.path
                    : pathname.startsWith(route.path)
                      ? "bg-blue-50 text-blue-500"
                      : "text-gray-700 hover:bg-gray-100"
                } transition`}
              >
                {route.name}
              </Link>
            ))}

            {/* Resource Management Section */}
            <div className="pt-2 pb-1">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                Resource Management
              </div>
              {resourceManagementRoutes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm ${
                    pathname.startsWith(route.path)
                      ? "bg-blue-50 text-blue-500"
                      : "text-gray-700 hover:bg-gray-100"
                  } transition`}
                >
                  {route.icon}
                  {route.name}
                </Link>
              ))}
            </div>

            {/* User Section */}
            <div className="border-t pt-3 mt-2">
              <div className="px-2 mb-3">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {navRole}
                </p>
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 w-full py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>

            {/* Quick Actions for Mobile */}
            {isAdminOrTutor && (
              <div className="border-t pt-3 mt-2">
                <div className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
                  Quick Actions
                </div>
                <Link
                  href="/admin/questions/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
                >
                  <HelpCircle className="h-4 w-4" />
                  New Question
                </Link>
                <Link
                  href="/admin/quizzes/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
                >
                  <BookOpen className="h-4 w-4" />
                  New Quiz
                </Link>
                <Link
                  href="/admin/curricula/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 px-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Library className="h-4 w-4" />
                  New Curriculum
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
