"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseCSV } from "@/lib/csv";
import { toast } from "@/components/ui/use-toast";
import { useGetTemplate } from "@/lib/api/queries";
import { usePostValidate, usePostBulkImport } from "@/lib/api/mutations";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
  Copy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionPreviewModal } from "./question-preview-modal";
import { QuizSearchInput } from "../quiz/quiz-search-input";
import { FolderSelect } from "./folder-select";
import {
  getPromptForClipboard,
  getBulkUploadPrompt,
} from "@/lib/bulk-upload-prompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentQuizId?: string;
  onComplete?: () => void;
  onAddToQuiz?: (questionIds: string[]) => void;
  initialFolderId?: string | null;
  lessonId?: string;
  onSuccess?: (quizId: string) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  currentQuizId,
  onComplete,
  onAddToQuiz,
  initialFolderId,
}: BulkUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "json" | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [addToExistingQuiz, setAddToExistingQuiz] = useState(false);
  const [targetQuizId, setTargetQuizId] = useState(currentQuizId || "");
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    initialFolderId || null
  );
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    count: 20,
    subject: "Mathematics",
    grade: "Year Three",
    customSubject: "",
    customGrade: "",
    questionTypes: ["multiple_choice", "true_false", "free_text"],
    topic: "",
    questionFormat: "standard",
    hintStyle: "helpful",
    correctFeedbackStyle: "encouraging",
    incorrectFeedbackStyle: "constructive",
    defaultTimeLimit: "none",
  });

  // Fetch templates from API - only when needed
  const {
    data: csvTemplateResponse,
    isLoading: csvTemplateLoading,
    error: csvTemplateError,
    refetch: refetchCSVTemplate,
  } = useGetTemplate("csv", { enabled: false });

  const {
    data: jsonTemplateResponse,
    isLoading: jsonTemplateLoading,
    error: jsonTemplateError,
    refetch: refetchJSONTemplate,
  } = useGetTemplate("json", { enabled: false });

  const csvImportMutation = usePostBulkImport("csv");
  const jsonImportMutation = usePostBulkImport("json");

  // Update folder ID when initialFolderId changes
  useEffect(() => {
    setTargetFolderId(initialFolderId || null);
  }, [initialFolderId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".csv")) {
        setFileType("csv");
        setFile(selectedFile);
        handleFileUpload(selectedFile, "csv");
      } else if (fileName.endsWith(".json")) {
        setFileType("json");
        setFile(selectedFile);
        handleFileUpload(selectedFile, "json");
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV or JSON file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (file: File, type: "csv" | "json") => {
    try {
      const text = await file.text();
      let questions: any[] = [];
      let errors: string[] = [];

      if (type === "csv") {
        const parseResult = parseCSV(text);
        questions = parseResult.questions;
        errors = parseResult.errors;
      } else {
        // For JSON, parse and validate the structure
        try {
          const jsonData = JSON.parse(text);

          // Handle both formats:
          // 1. Direct array of questions: [{question1}, {question2}]
          // 2. Nested structure: {questions: [{question1}, {question2}]}
          if (Array.isArray(jsonData)) {
            // Direct array format
            questions = jsonData;
            errors = [];
          } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
            // Nested structure format
            questions = jsonData.questions;
            errors = [];
          } else {
            questions = [];
            errors = [
              "Invalid JSON structure. Expected array of questions or {questions: [...]} format.",
            ];
          }
        } catch (jsonError) {
          questions = [];
          errors = ["Invalid JSON format"];
        }
      }

      setParsedQuestions(questions);
      setParseErrors(errors);

      if (questions.length > 0 && errors.length === 0) {
        setActiveTab("preview");
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description:
          error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0 || !file || !fileType) return;

    setImporting(true);
    setImportProgress(0);

    try {
      let result;

      if (fileType === "csv") {
        result = await csvImportMutation.mutateAsync({
          file,
          addToQuizId: addToExistingQuiz ? targetQuizId : undefined,
          folderId: targetFolderId || undefined,
        });
      } else {
        result = await jsonImportMutation.mutateAsync({
          file,
          addToQuizId: addToExistingQuiz ? targetQuizId : undefined,
          folderId: targetFolderId || undefined,
        });
      }

      console.log("Import result:", result);
      setImportProgress(100);

      // For now, just show success and move to results
      setImportResult({
        success: parsedQuestions.length,
        failed: 0,
        errors: [],
      });
      setActiveTab("results");

      toast({
        title: "Import completed",
        description: `Successfully imported ${parsedQuestions.length} question${
          parsedQuestions.length > 1 ? "s" : ""
        }`,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Failed to import questions",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await refetchCSVTemplate();
      const csvContent = result.data;
      if (csvContent) {
        // Create a blob with CSV content and proper MIME type
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "question_import_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download successful",
          description: "CSV template downloaded successfully",
        });
      } else {
        toast({
          title: "Template not available",
          description: "Please try again in a moment",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = await handleBlobError(error);
      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownloadJSONTemplate = async () => {
    try {
      const result = await refetchJSONTemplate();
      const jsonContent = result.data;

      if (jsonContent) {
        // Ensure we have a properly formatted JSON string
        const jsonString =
          typeof jsonContent === "string"
            ? jsonContent
            : JSON.stringify(jsonContent, null, 2);

        // Create a blob with JSON content and proper MIME type
        const blob = new Blob([jsonString], {
          type: "application/json;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "question_import_template.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download successful",
          description: "JSON template downloaded successfully",
        });
      } else {
        toast({
          title: "Template not available",
          description: "Please try again in a moment",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = await handleBlobError(error);
      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBlobError = async (error: any) => {
    if (
      error.response &&
      error.response.data instanceof Blob &&
      error.response.data.type === "application/json"
    ) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        return json.error || "An unexpected error occurred.";
      } catch {
        return "Failed to parse error response.";
      }
    }
    return "An error occurred while downloading the template.";
  };

  const handleCopyPrompt = async () => {
    setAiPromptOpen(true);
  };

  const handleGeneratePrompt = async () => {
    try {
      const prompt = getBulkUploadPrompt({
        count: aiConfig.count,
        subject:
          aiConfig.subject === "custom"
            ? aiConfig.customSubject
            : aiConfig.subject,
        grade:
          aiConfig.grade === "custom" ? aiConfig.customGrade : aiConfig.grade,
        questionTypes: aiConfig.questionTypes,
        topic: aiConfig.topic,
        questionFormat: aiConfig.questionFormat,
        hintStyle: aiConfig.hintStyle,
        correctFeedbackStyle: aiConfig.correctFeedbackStyle,
        incorrectFeedbackStyle: aiConfig.incorrectFeedbackStyle,
        defaultTimeLimit: aiConfig.defaultTimeLimit,
      });
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Prompt copied!",
        description: `AI prompt for ${aiConfig.count} questions has been copied to your clipboard.`,
      });
      setAiPromptOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or manually copy the prompt.",
        variant: "destructive",
      });
    }
  };

  const handleValidateFile = async () => {
    if (!file) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const text = await file.text();
      let errors: string[] = [];
      let questionCount = 0;

      if (fileType === "csv") {
        const parseResult = parseCSV(text);
        errors = parseResult.errors;
        questionCount = parseResult.questions.length;
      } else {
        // For JSON, validate the structure
        try {
          const jsonData = JSON.parse(text);

          // Handle both formats:
          // 1. Direct array of questions: [{question1}, {question2}]
          // 2. Nested structure: {questions: [{question1}, {question2}]}
          if (Array.isArray(jsonData)) {
            // Direct array format
            errors = [];
            questionCount = jsonData.length;
          } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
            // Nested structure format
            errors = [];
            questionCount = jsonData.questions.length;
          } else {
            errors = [
              "Invalid JSON structure. Expected array of questions or {questions: [...]} format.",
            ];
            questionCount = 0;
          }
        } catch (jsonError) {
          errors = ["Invalid JSON format"];
          questionCount = 0;
        }
      }

      setValidationResult({
        valid: errors.length === 0,
        errors,
        questionCount,
      });

      if (errors.length === 0) {
        toast({
          title: "File validated",
          description: `File validation successful! ${questionCount} questions found.`,
        });
      } else {
        toast({
          title: "File validation failed",
          description: `Validation failed: ${errors.join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error validating file",
        description:
          error instanceof Error ? error.message : "Failed to validate file",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setFileType(null);
    setParsedQuestions([]);
    setParseErrors([]);
    setValidationResult(null);
    setIsValidating(false);
    setAddToExistingQuiz(false);
    setTargetQuizId(currentQuizId || "");
    setTargetFolderId(initialFolderId || null);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setActiveTab("upload");
    setSelectedQuestion(null);
    setPreviewOpen(false);
    setAiPromptOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "free_text":
        return "Free Text";
      case "matching_pairs":
        return "Matching Pairs";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Questions</DialogTitle>
          <DialogDescription>
            Import multiple questions from a CSV file
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger
              value="preview"
              disabled={
                parsedQuestions.length === 0 || !validationResult?.valid
              }
            >
              Preview ({parsedQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>
              Results
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>File Upload</Label>
                  <div className="mt-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {file ? file.name : "Choose CSV or JSON file"}
                    </Button>
                  </div>

                  {file && !validationResult && (
                    <div className="mt-3">
                      <Button
                        onClick={handleValidateFile}
                        disabled={isValidating}
                        className="w-full"
                        variant="secondary"
                      >
                        {isValidating ? "Validating..." : "Validate File"}
                      </Button>
                    </div>
                  )}

                  {validationResult && (
                    <div className="mt-3">
                      {validationResult.valid ? (
                        <Alert>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            File validation successful!{" "}
                            {validationResult.questionCount} questions found.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Validation failed:{" "}
                            {validationResult.errors?.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="space-y-3">
                    <Label>Organization Options</Label>

                    {/* Folder Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="folder-select">Import to Folder</Label>
                      <FolderSelect
                        value={targetFolderId}
                        onChange={setTargetFolderId}
                        placeholder="Select folder or leave empty for root level"
                        className="w-full"
                      />
                    </div>

                    {/* Quiz Selection */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="add-to-quiz"
                        checked={addToExistingQuiz}
                        onCheckedChange={setAddToExistingQuiz}
                      />
                      <Label htmlFor="add-to-quiz">
                        Also add questions to a quiz
                      </Label>
                    </div>
                    {addToExistingQuiz && (
                      <div className="space-y-2">
                        <Label>Select Quiz</Label>
                        <QuizSearchInput
                          value={targetQuizId}
                          onChange={setTargetQuizId}
                          placeholder="Search for a quiz..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p>
                        Your file should include all question properties.
                        Different question types require different fields.
                        Supported formats: CSV and JSON.
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>JSON Format:</strong> Can be either a direct
                        array of questions or {"{questions: [...]}"} structure.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleDownloadTemplate}
                          className="p-0 h-auto"
                          disabled={csvTemplateLoading}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {csvTemplateLoading
                            ? "Downloading..."
                            : "Download CSV template with examples"}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleDownloadJSONTemplate}
                          className="p-0 h-auto"
                          disabled={jsonTemplateLoading}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {jsonTemplateLoading
                            ? "Downloading..."
                            : "Download JSON template with examples"}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleCopyPrompt}
                          className="p-0 h-auto text-purple-600 hover:text-purple-700"
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Copy AI prompt for generating questions
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Tip:</strong> Use the AI prompt with ChatGPT,
                        Claude, or any LLM to generate bulk properly formatted
                        questions instantly!
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {parseErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Parse Errors:</p>
                        <ScrollArea className="h-32">
                          {parseErrors.map((error, index) => (
                            <p key={index} className="text-sm">
                              {error}
                            </p>
                          ))}
                        </ScrollArea>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedQuestions.length} questions ready to import
                  </p>
                  <Button size="sm" variant="ghost" onClick={resetDialog}>
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {parsedQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedQuestion(question);
                          setPreviewOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium line-clamp-2">
                              {question.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuestion(question);
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                question.type === "multiple_choice" &&
                                  "bg-blue-100 text-blue-700",
                                question.type === "true_false" &&
                                  "bg-green-100 text-green-700",
                                question.type === "free_text" &&
                                  "bg-purple-100 text-purple-700",
                                question.type === "matching_pairs" &&
                                  "bg-orange-100 text-orange-700"
                              )}
                            >
                              {getQuestionTypeLabel(question.type)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {question.hint && (
                            <span className="text-muted-foreground">
                              Has hint
                            </span>
                          )}
                          {question.correct_feedback && (
                            <span className="text-muted-foreground">
                              Has feedback
                            </span>
                          )}
                          {question.time_limit && (
                            <span className="text-muted-foreground">
                              Time limit: {question.time_limit}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {importing && (
                  <div className="space-y-2">
                    <Progress value={importProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Importing questions... {Math.round(importProgress)}%
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {importResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-2xl font-bold">
                          {importResult.success}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Successfully imported
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-2xl font-bold">
                          {importResult.failed}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Failed to import
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-semibold">Import Errors:</p>
                          <ScrollArea className="h-32">
                            {importResult.errors.map((error, index) => (
                              <p key={index} className="text-sm">
                                {error}
                              </p>
                            ))}
                          </ScrollArea>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          {activeTab === "upload" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setActiveTab("preview")}
                disabled={parsedQuestions.length === 0}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </>
          )}

          {activeTab === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => setActiveTab("upload")}
                disabled={importing}
              >
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedQuestions.length} Questions
              </Button>
            </>
          )}

          {activeTab === "results" && (
            <Button
              onClick={() => {
                resetDialog();
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Question Preview Modal */}
      <QuestionPreviewModal
        question={selectedQuestion}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* AI Prompt Configuration Dialog */}
      <Dialog open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate AI Prompt</DialogTitle>
            <DialogDescription>
              Configure the options for generating questions with AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  min="1"
                  max="500"
                  value={aiConfig.count}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty value for backspace/delete
                    if (value === "") {
                      setAiConfig({ ...aiConfig, count: 0 });
                      return;
                    }
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 0 && num <= 500) {
                      setAiConfig({ ...aiConfig, count: num });
                    }
                  }}
                  onBlur={() => {
                    if (aiConfig.count === 0 || isNaN(aiConfig.count)) {
                      setAiConfig({ ...aiConfig, count: 20 });
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={aiConfig.subject}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Maths</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="custom">Custom Subject</SelectItem>
                  </SelectContent>
                </Select>
                {aiConfig.subject === "custom" && (
                  <div className="mt-2 space-y-1">
                    <Textarea
                      placeholder="Add subject specifications (e.g., 'Advanced algebra focusing on quadratic equations, factoring, and graphing parabolas for students preparing for SATs')"
                      value={aiConfig.customSubject}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          customSubject: e.target.value.slice(0, 3000),
                        })
                      }
                      className="min-h-[80px]"
                      maxLength={3000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {aiConfig.customSubject.length}/3000 characters
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={aiConfig.grade}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Year One">Year One</SelectItem>
                    <SelectItem value="Year Two">Year Two</SelectItem>
                    <SelectItem value="Year Three">Year Three</SelectItem>
                    <SelectItem value="Year Four">Year Four</SelectItem>
                    <SelectItem value="Year Five">Year Five</SelectItem>
                    <SelectItem value="Year Six">Year Six</SelectItem>
                    <SelectItem value="custom">Custom Grade</SelectItem>
                  </SelectContent>
                </Select>
                {aiConfig.grade === "custom" && (
                  <div className="mt-2 space-y-1">
                    <Textarea
                      placeholder="Add grade/level specifications (e.g., 'Advanced 11th grade students, AP level, preparing for college entrance exams')"
                      value={aiConfig.customGrade}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          customGrade: e.target.value.slice(0, 3000),
                        })
                      }
                      className="min-h-[80px]"
                      maxLength={3000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {aiConfig.customGrade.length}/3000 characters
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Types</Label>
              {aiConfig.questionTypes.includes("matching") && (
                <Alert className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Matching questions must be generated separately and cannot
                    be mixed with other question types.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "multiple_choice", label: "Multiple Choice" },
                  { value: "true_false", label: "True/False" },
                  { value: "free_text", label: "Free Text" },
                  {
                    value: "matching_pairs",
                    label: "Matching Pairs (separate generation)",
                  },
                ].map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Switch
                      id={type.value}
                      checked={aiConfig.questionTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // If matching is selected, deselect all others and show toast
                          if (type.value === "matching_pairs") {
                            setAiConfig({
                              ...aiConfig,
                              questionTypes: ["matching_pairs"],
                            });
                            toast({
                              title: "Matching Pairs Questions",
                              description:
                                "Matching questions must be generated separately from other question types.",
                            });
                          }
                          // If another type is selected while matching is selected, replace matching
                          else if (
                            aiConfig.questionTypes.includes("matching_pairs")
                          ) {
                            setAiConfig({
                              ...aiConfig,
                              questionTypes: [type.value],
                            });
                            toast({
                              title: "Question Type Changed",
                              description:
                                "Matching Pairs questions cannot be mixed with other types.",
                            });
                          }
                          // Normal selection
                          else {
                            setAiConfig({
                              ...aiConfig,
                              questionTypes: [
                                ...aiConfig.questionTypes,
                                type.value,
                              ],
                            });
                          }
                        } else {
                          setAiConfig({
                            ...aiConfig,
                            questionTypes: aiConfig.questionTypes.filter(
                              (t) => t !== type.value
                            ),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={type.value}
                      className="font-normal cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic/Subject Details</Label>
              <Textarea
                id="topic"
                placeholder="E.g., 'Quadratic equations and their applications in real-world problems, including projectile motion and area optimization'"
                value={aiConfig.topic}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, topic: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-format">Question Format</Label>
                <Select
                  value={aiConfig.questionFormat}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, questionFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="word-problems">Word Problems</SelectItem>
                    <SelectItem value="real-world">
                      Real World Applications
                    </SelectItem>
                    <SelectItem value="conceptual">
                      Conceptual Understanding
                    </SelectItem>
                    <SelectItem value="mixed">Mixed Formats</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-limit">Default Time Limit</Label>
                <Select
                  value={aiConfig.defaultTimeLimit}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, defaultTimeLimit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No time limit</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="90">1.5 minutes</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hint-style">Hint Style</Label>
                <Select
                  value={aiConfig.hintStyle}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, hintStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="helpful">
                      Helpful - Guide towards solution
                    </SelectItem>
                    <SelectItem value="scaffolded">
                      Scaffolded - Step-by-step hints
                    </SelectItem>
                    <SelectItem value="conceptual">
                      Conceptual - Focus on understanding
                    </SelectItem>
                    <SelectItem value="minimal">
                      Minimal - Brief nudges only
                    </SelectItem>
                    <SelectItem value="none">No hints</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="correct-feedback">
                  Correct Answer Feedback Style
                </Label>
                <Select
                  value={aiConfig.correctFeedbackStyle}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, correctFeedbackStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encouraging">
                      Encouraging - Positive reinforcement
                    </SelectItem>
                    <SelectItem value="explanatory">
                      Explanatory - Explain why it's correct
                    </SelectItem>
                    <SelectItem value="next-steps">
                      Next Steps - Suggest what to learn next
                    </SelectItem>
                    <SelectItem value="brief">
                      Brief - Simple acknowledgment
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incorrect-feedback">
                  Incorrect Answer Feedback Style
                </Label>
                <Select
                  value={aiConfig.incorrectFeedbackStyle}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, incorrectFeedbackStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constructive">
                      Constructive - Guide to correct answer
                    </SelectItem>
                    <SelectItem value="explanatory">
                      Explanatory - Explain the mistake
                    </SelectItem>
                    <SelectItem value="hints">
                      Hints - Provide hints to retry
                    </SelectItem>
                    <SelectItem value="solution">
                      Solution - Show correct answer with explanation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    This will generate a custom prompt for creating{" "}
                    {aiConfig.count} questions. The prompt can be used with
                    ChatGPT, Claude, or any other AI tool to generate questions
                    in bulk.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The AI will generate a properly formatted CSV file that you
                    can upload directly.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiPromptOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePrompt}
              disabled={aiConfig.questionTypes.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy AI Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
