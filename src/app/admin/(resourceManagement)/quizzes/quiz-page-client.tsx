"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizList } from "@/components/resourceManagemement/quiz/quiz-list";

interface QuizPageClientProps {
  quizzes: any[];
}

export function QuizPageClient({ quizzes }: QuizPageClientProps) {
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
  }, []);

  const userRole = user?.userRole;
  const canEdit = userRole !== "student";

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <QuizList quizzes={quizzes} canEdit={canEdit} />;
}
