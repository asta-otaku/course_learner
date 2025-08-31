"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateQuizFormWithUpload } from "../quiz/create-quiz-form-with-upload";
import { searchQuizzes, addQuizToLesson } from "@/app/actions/quizzes";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Plus,
  CheckCircle,
  Clock,
  HelpCircle,
  Users,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  created_by: string;
  created_by_name: string;
  created_at: string;
  quiz_questions: { id: string }[];
}

interface AddQuizDialogProps {
  lessonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  existingQuizIds?: string[]; // IDs of quizzes already in the lesson
}

export function AddQuizDialog({
  lessonId,
  open,
  onOpenChange,
  onSuccess,
  existingQuizIds = [],
}: AddQuizDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("existing");
  const [searchTerm, setSearchTerm] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && activeTab === "existing") {
      searchForQuizzes();
    }
  }, [open, searchTerm, activeTab]);

  const searchForQuizzes = async () => {
    setLoading(true);
    try {
      const result = await searchQuizzes(searchTerm);
      if (result.success) {
        // Server action now handles filtering for published + user's draft quizzes
        setQuizzes(result.data);
      }
    } catch (error) {
      console.error("Error searching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const isQuizAlreadyAdded = (quizId: string) => {
    return existingQuizIds.includes(quizId);
  };

  const handleAddQuiz = async () => {
    if (!selectedQuiz || isQuizAlreadyAdded(selectedQuiz.id)) return;

    setAdding(true);
    try {
      const result = await addQuizToLesson(lessonId, selectedQuiz.id);

      if (result.success) {
        toast({
          title: "Quiz added successfully",
          description: `"${selectedQuiz.title}" has been added to this lesson.`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast({
          title: "Failed to add quiz",
          description: (result as any).error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error adding quiz",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleCreateSuccess = () => {
    toast({
      title: "Quiz created successfully",
      description: "The quiz has been created and added to this lesson.",
    });
    onOpenChange(false);
    if (onSuccess) onSuccess();
    router.refresh();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Quiz to Lesson</DialogTitle>
            <DialogDescription>
              Select an existing quiz or create a new one for this lesson
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="existing">
                <FileText className="h-4 w-4 mr-2" />
                Existing Quiz
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="existing"
              className="flex-1 overflow-y-auto mt-4"
            >
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quizzes by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-3" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "No quizzes found matching your search"
                          : "No quizzes available (shows published quizzes and your drafts)"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => {
                        const isAlreadyAdded = isQuizAlreadyAdded(quiz.id);
                        return (
                          <div
                            key={quiz.id}
                            className={cn(
                              "p-4 border rounded-lg transition-colors",
                              isAlreadyAdded
                                ? "cursor-not-allowed opacity-60 bg-muted/30"
                                : "cursor-pointer",
                              !isAlreadyAdded && selectedQuiz?.id === quiz.id
                                ? "border-primaryBlue bg-primaryBlue/5"
                                : !isAlreadyAdded && "hover:bg-muted/50"
                            )}
                            onClick={() =>
                              !isAlreadyAdded && setSelectedQuiz(quiz)
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium line-clamp-1">
                                  {quiz.title}
                                </h4>
                                {quiz.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {quiz.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    <span>
                                      {quiz.quiz_questions.length} questions
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{quiz.created_by_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {new Date(
                                        quiz.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 ml-2">
                                <Badge
                                  className={cn(getStatusColor(quiz.status))}
                                >
                                  {quiz.status}
                                </Badge>
                                {isAlreadyAdded && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800"
                                  >
                                    Already Added
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!isAlreadyAdded &&
                              selectedQuiz?.id === quiz.id && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-primaryBlue">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Selected</span>
                                </div>
                              )}
                            {isAlreadyAdded && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>This quiz is already in the lesson</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedQuiz && !isQuizAlreadyAdded(selectedQuiz.id) && (
                  <Alert className="border-primaryBlue">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Selected:</strong> {selectedQuiz.title} (
                      {selectedQuiz.quiz_questions.length} questions)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={adding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuiz}
                  disabled={
                    !selectedQuiz ||
                    adding ||
                    (selectedQuiz && isQuizAlreadyAdded(selectedQuiz.id))
                  }
                >
                  {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedQuiz && isQuizAlreadyAdded(selectedQuiz.id)
                    ? "Already Added"
                    : "Add Selected Quiz"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <CreateQuizFormWithUpload
                lessonId={lessonId}
                onSuccess={handleCreateSuccess}
                onCancel={() => onOpenChange(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
