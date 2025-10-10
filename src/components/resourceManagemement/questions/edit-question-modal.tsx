"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UniversalQuestionEditor } from "./universal-question-editor";
import { QuestionPreview } from "./question-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, Eye, FileText } from "lucide-react";
import type { Question } from "@/lib/validations/question";

interface EditQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Partial<Question>;
  questionIndex: number;
  onSave: (question: Partial<Question>) => void;
  onCancel: () => void;
}

export function EditQuestionModal({
  open,
  onOpenChange,
  question,
  questionIndex,
  onSave,
  onCancel,
}: EditQuestionModalProps) {
  const [editedQuestion, setEditedQuestion] =
    useState<Partial<Question>>(question);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const originalQuestionRef = useRef<Partial<Question>>(question);

  // Reset state when question changes
  useEffect(() => {
    setEditedQuestion(question);
    originalQuestionRef.current = question;
    setHasChanges(false);
  }, [question]);

  const handleQuestionChange = (updatedQuestion: Partial<Question>) => {
    setEditedQuestion(updatedQuestion);
    const hasChangesNow =
      JSON.stringify(updatedQuestion) !==
      JSON.stringify(originalQuestionRef.current);

    setHasChanges(hasChangesNow);
  };

  const handleValidationChange = (valid: boolean, errors: string[]) => {
    setIsValid(valid);
    setValidationErrors(errors);
  };

  const handleSave = () => {
    if (!isValid) return;
    onSave(editedQuestion);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );
      if (!confirmDiscard) return;
    }

    setEditedQuestion(originalQuestionRef.current);
    setHasChanges(false);
    onCancel();
    onOpenChange(false);
  };

  const getQuestionTypeLabel = (type?: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "free_text":
        return "Free Text";
      case "matching":
        return "Matching Pairs";
      case "matching_pairs":
        return "Matching Pairs";
      default:
        return "Unknown";
    }
  };

  const getQuestionTypeColor = (type?: string) => {
    switch (type) {
      case "multiple_choice":
        return "bg-blue-100 text-blue-800";
      case "true_false":
        return "bg-purple-100 text-purple-800";
      case "free_text":
        return "bg-green-100 text-green-800";
      case "matching":
        return "bg-orange-100 text-orange-800";
      case "matching_pairs":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Edit Question {questionIndex + 1}
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved Changes
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getQuestionTypeColor(editedQuestion.type)}
                >
                  {getQuestionTypeLabel(editedQuestion.type)}
                </Badge>
                {editedQuestion.time_limit && (
                  <Badge variant="outline">
                    {editedQuestion.time_limit}s time limit
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="edit" className="h-full flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="edit" className="h-full m-0">
                <div className="h-full overflow-y-auto px-6">
                  <div className="py-4">
                    <UniversalQuestionEditor
                      question={editedQuestion}
                      onChange={handleQuestionChange}
                      onValidationChange={handleValidationChange}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0">
                <div className="h-full overflow-y-auto px-6">
                  <div className="py-4">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        This is how the question will appear to students:
                      </div>
                      <QuestionPreview
                        question={editedQuestion as any}
                        showAnswers={true}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-0 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {!isValid && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {validationErrors.length} validation error
                  {validationErrors.length !== 1 ? "s" : ""}
                </div>
              )}
              {isValid && hasChanges && (
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Unsaved changes
                </div>
              )}
              {isValid && !hasChanges && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Ready to save
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
