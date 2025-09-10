import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Home } from "lucide-react";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

interface QuizResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuizResultsPage({
  params,
}: QuizResultsPageProps) {
  const { id: attemptId } = await params;

  // TODO: Replace with API call to get quiz attempt results
  // For now, show a placeholder message

  return (
    <div className="mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quiz Results</h1>
            <p className="text-muted-foreground">Attempt ID: {attemptId}</p>
          </div>
          <Button asChild className="w-fit">
            <Link href="/admin/quizzes">
              <Home className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Link>
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Quiz results functionality is temporarily unavailable during the API
            migration. This feature will be restored soon with the new backend
            integration.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Migration Notice</CardTitle>
            <CardDescription>
              We're updating our systems to use the new API infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The quiz results viewing functionality is being migrated to work
              with our new backend API. This feature will be available again
              soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
