"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";
import { parseCSV } from "@/lib/csv";
import { toast } from "sonner";
import type { Question } from "@/lib/validations/question";
import { FolderSelect } from "@/components/resourceManagemement/questions/folder-select";
import { useGetTemplate } from "@/lib/api/queries";
import { usePostBulkImport } from "@/lib/api/mutations";

export default function ImportQuestionsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "json" | null>(null);
  const [csvContent, setCsvContent] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch templates from API
  const {
    data: csvTemplateResponse,
    isLoading: csvTemplateLoading,
    refetch: refetchCSVTemplate,
  } = useGetTemplate("csv", { enabled: false });

  const {
    data: jsonTemplateResponse,
    isLoading: jsonTemplateLoading,
    refetch: refetchJSONTemplate,
  } = useGetTemplate("json", { enabled: false });

  // Import mutations
  const csvImportMutation = usePostBulkImport("csv");
  const jsonImportMutation = usePostBulkImport("json");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".csv")) {
        setFileType("csv");
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCsvContent(content);
          handleParseFile(content, "csv");
        };
        reader.readAsText(selectedFile);
      } else if (fileName.endsWith(".json")) {
        setFileType("json");
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          handleParseFile(content, "json");
        };
        reader.readAsText(selectedFile);
      } else {
        toast.error("Please select a valid CSV or JSON file");
      }
    }
  };

  const handleParseFile = (content: string, type: "csv" | "json") => {
    if (!content.trim()) {
      setParsedQuestions([]);
      setParseErrors([]);
      return;
    }

    let questions: any[] = [];
    let errors: string[] = [];

    if (type === "csv") {
      const parseResult = parseCSV(content);
      questions = parseResult.questions;
      errors = parseResult.errors;
    } else {
      // For JSON, parse and validate the structure
      try {
        const jsonData = JSON.parse(content);

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
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0 || !file || !fileType) {
      toast.error("No valid questions to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      let result;

      if (fileType === "csv") {
        result = await csvImportMutation.mutateAsync({
          file,
          folderId: selectedFolderId || undefined,
        });
      } else {
        result = await jsonImportMutation.mutateAsync({
          file,
          folderId: selectedFolderId || undefined,
        });
      }

      console.log("Import result:", result);
      setImportProgress(100);

      // For now, just show success and move to results
      setImportResults({
        successful: parsedQuestions.length,
        failed: 0,
        errors: [],
      });

      toast.success(
        `Successfully imported ${parsedQuestions.length} questions`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import questions"
      );
      setImportResults({
        successful: 0,
        failed: parsedQuestions.length,
        errors: [
          `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      });
    } finally {
      setIsImporting(false);
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

        toast.success("CSV template downloaded successfully");
      } else {
        toast.error("Template not available. Please try again in a moment.");
      }
    } catch (error) {
      const errorMessage = await handleBlobError(error);
      toast.error(`Download failed: ${errorMessage}`);
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

        toast.success("JSON template downloaded successfully");
      } else {
        toast.error("Template not available. Please try again in a moment.");
      }
    } catch (error) {
      const errorMessage = await handleBlobError(error);
      toast.error(`Download failed: ${errorMessage}`);
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

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/questions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Import Questions</h1>
          <p className="text-muted-foreground">
            Import questions from CSV or JSON files
          </p>
        </div>

        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Templates
            </CardTitle>
            <CardDescription>
              Download template files to see the required format for importing
              questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                disabled={csvTemplateLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {csvTemplateLoading
                  ? "Downloading..."
                  : "Download CSV Template"}
              </Button>
              <Button
                onClick={handleDownloadJSONTemplate}
                variant="outline"
                disabled={jsonTemplateLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {jsonTemplateLoading
                  ? "Downloading..."
                  : "Download JSON Template"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>CSV Format:</strong> Traditional spreadsheet format with
                comma-separated values.
              </p>
              <p>
                <strong>JSON Format:</strong> Can be either a direct array of
                questions or {"{questions: [...]}"} structure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select a CSV or JSON file containing your questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">File Upload</Label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaryBlue file:text-primary-foreground hover:file:bg-primaryBlue/90"
              />
            </div>

            {fileType === "csv" && (
              <div>
                <Label htmlFor="csv-content">Or paste CSV content</Label>
                <Textarea
                  id="csv-content"
                  value={csvContent}
                  onChange={(e) => {
                    setCsvContent(e.target.value);
                    handleParseFile(e.target.value, "csv");
                  }}
                  placeholder="Paste your CSV content here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="folder-select">Add to Folder</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Organize your questions by adding them to a folder. This
                        helps keep your question bank structured and easy to
                        navigate.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FolderSelect
                value={selectedFolderId}
                onChange={setSelectedFolderId}
                placeholder="Select folder or leave empty for root level"
              />
            </div>
          </CardContent>
        </Card>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Parsing Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {parseErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Parsed Questions Preview */}
        {parsedQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Preview ({parsedQuestions.length} questions)
              </CardTitle>
              <CardDescription>
                Review the questions before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {parsedQuestions.slice(0, 10).map((question, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{question.content}</h4>
                      <Badge variant="outline">
                        {question.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {(question as any).difficulty && (
                        <span>
                          Difficulty: {(question as any).difficulty}/10
                        </span>
                      )}
                      {(question as any).tags &&
                        (question as any).tags.length > 0 && (
                          <span>Tags: {(question as any).tags.join(", ")}</span>
                        )}
                    </div>
                  </div>
                ))}
                {parsedQuestions.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... and {parsedQuestions.length - 10} more questions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Progress */}
        {isImporting && (
          <Card>
            <CardHeader>
              <CardTitle>Importing Questions</CardTitle>
              <CardDescription>
                Please wait while we import your questions...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(importProgress)}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.successful}
                  </div>
                  <div className="text-sm text-green-700">
                    Successfully imported
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.failed}
                  </div>
                  <div className="text-sm text-red-700">Failed to import</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2 max-h-32 overflow-y-auto">
                      {importResults.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button onClick={() => router.push("/admin/questions")}>
                  Go to Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Button */}
        {parsedQuestions.length > 0 && !isImporting && !importResults && (
          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              disabled={parseErrors.length > 0}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import {parsedQuestions.length} Questions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
