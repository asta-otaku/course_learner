"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { createClient } from '@/lib/supabase/client'
// import { User } from '@supabase/supabase-js'
import {
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  HelpCircle,
  Library,
  Shield,
  Plus,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

type UserRole = "user" | "tutor" | "admin";

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    {
      label: "Questions",
      href: "/admin/questions",
      icon: <HelpCircle className="w-4 h-4" />,
      roles: ["admin", "tutor"],
    },
    {
      label: "Quizzes",
      href: "/admin/quizzes",
      icon: <BookOpen className="w-4 h-4" />,
      roles: ["admin", "teacher"],
    },
    {
      label: "Curriculum",
      href: "/admin/curricula",
      icon: <Library className="w-4 h-4" />,
      roles: ["admin", "teacher"],
    },
  ],
  tutor: [
    {
      label: "Questions",
      href: "/questions",
      icon: <HelpCircle className="w-4 h-4" />,
      roles: ["admin", "teacher"],
    },
    {
      label: "Quizzes",
      href: "/quizzes",
      icon: <BookOpen className="w-4 h-4" />,
      roles: ["admin", "teacher"],
    },
    {
      label: "Curriculum",
      href: "/curricula",
      icon: <Library className="w-4 h-4" />,
      roles: ["admin", "teacher"],
    },
  ],
  user: [
    {
      label: "Quizzes",
      href: "/quizzes",
      icon: <BookOpen className="w-4 h-4" />,
      roles: ["student"],
    },
  ],
};

// Create a singleton Supabase client for the component
// let supabaseClient: ReturnType<typeof createClient> | null = null
// const getSupabaseClient = () => {
//   if (!supabaseClient) {
//     supabaseClient = createClient()
//   }
//   return supabaseClient
// }

export function TopNavigation() {
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    userRole: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Move localStorage logic to useEffect to prevent infinite re-renders
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
  }, []); // Empty dependency array - only run once on mount

  // const supabase = useMemo(() => getSupabaseClient(), []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Map database roles to nav items
  const navRole = user?.userRole;
  const userNavItems = useMemo(() => {
    if (navRole && navRole in navItems) {
      return navItems[navRole as UserRole];
    }
    return navItems.user; // Fallback to user navigation
  }, [navRole]);

  // Ensure userNavItems is always an array and has items
  const safeNavItems = Array.isArray(userNavItems) ? userNavItems : [];

  // Check if user has admin or tutor role for conditional rendering
  const isAdminOrTutor = navRole === "admin" || navRole === "tutor";

  // Don't render until user data is loaded
  if (isLoading || !user) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="font-poppins font-bold text-xl text-primaryBlue">
            MathEd Platform
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Loading...
          </div>
        </div>
      </nav>
    );
  }

  const handleSignOut = async () => {
    // await supabase.auth.signOut();
    router.push("/admin/sign-in");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <Link
          href={safeNavItems[0]?.href || "/questions"}
          className="flex items-center space-x-2 mr-6"
        >
          <div className="font-poppins font-bold text-xl text-primaryBlue">
            MathEd Platform
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-between">
          <nav className="flex items-center space-x-6">
            {safeNavItems.map((item: NavItem) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                {item.icon}
                <span className="font-poppins">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {/* Quick Actions for Teachers/Admins */}
            {isAdminOrTutor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="font-poppins">
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/questions/new"
                      className="cursor-pointer"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span className="font-poppins">New Question</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/quizzes/new" className="cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span className="font-poppins">New Quiz</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/curricula/new"
                      className="cursor-pointer"
                    >
                      <Library className="mr-2 h-4 w-4" />
                      <span className="font-poppins">New Curriculum</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primaryBlue/10">
                    <UserIcon className="h-5 w-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none font-poppins">
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
                    <span className="font-poppins">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="font-poppins">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-poppins">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {safeNavItems.map((item: NavItem) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {item.icon}
                <span className="font-poppins">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="border-t px-4 py-3">
            <div className="mb-3">
              <p className="text-sm font-medium font-poppins">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {navRole}
              </p>
            </div>
            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <UserIcon className="h-4 w-4" />
                <span className="font-poppins">Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span className="font-poppins">Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-poppins">Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
