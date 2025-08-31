"use client";

import { CreateQuizForm } from "@/components/resourceManagemement/quiz/create-quiz-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function CreateQuizPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userData = JSON.parse(localStorage.getItem("admin") || "{}");
        if (!userData || !userData.data) {
          router.push("/admin/sign-in");
          return;
        }

        const userRole = userData.data.userRole;
        if (userRole !== "teacher" && userRole !== "admin") {
          router.push("/admin/sign-in");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/admin/sign-in");
        return;
      } finally {
        setIsLoading(false);
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-2xl mx-auto py-6 flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground mt-1">
            Start by setting up the basic details of your quiz
          </p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Quiz Creation Process:</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Create the quiz with basic information</li>
              <li>Add questions from the question bank or create new ones</li>
              <li>Use "Select All" to quickly add multiple questions</li>
              <li>
                Use "Bulk Upload" button in the question bank to import
                questions from CSV or AI
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto">
          <CreateQuizForm />
        </div>
      </div>
    </div>
  );
}
