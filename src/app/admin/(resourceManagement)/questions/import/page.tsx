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
import { parseCSV, getCSVTemplate, downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import type { Question } from "@/lib/validations/question";
import { FolderSelect } from "@/components/resourceManagemement/questions/folder-select";
import { bulkImportQuestions } from "@/app/actions/bulk-import";

export default function ImportQuestionsPage() {
  const router = useRouter();
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        handleParseCSV(content);
      };
      reader.readAsText(file);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleParseCSV = (content: string) => {
    if (!content.trim()) {
      setParsedQuestions([]);
      setParseErrors([]);
      return;
    }

    const { questions, errors } = parseCSV(content);
    setParsedQuestions(questions);
    setParseErrors(errors);
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) {
      toast.error("No valid questions to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const result = await bulkImportQuestions({
        csvContent,
        folderId: selectedFolderId,
      });

      setImportProgress(100);
      setImportResults({
        successful: result.success,
        failed: result.failed,
        errors: result.errors.map((e) => `Row ${e.row}: ${e.error}`),
      });

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} questions`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} questions`);
      }
    } catch (error) {
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

  const downloadTemplate = () => {
    const template = getCSVTemplate();
    downloadCSV("question-template.csv", template);
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
            Import questions from a CSV file
          </p>
        </div>

        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download a template file to see the required format for importing
              questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing your questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primaryBlue file:text-primary-foreground hover:file:bg-primaryBlue/90"
              />
            </div>

            <div>
              <Label htmlFor="csv-content">Or paste CSV content</Label>
              <Textarea
                id="csv-content"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  handleParseCSV(e.target.value);
                }}
                placeholder="Paste your CSV content here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

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
                      <h4 className="font-medium">{question.title}</h4>
                      <Badge variant="outline">
                        {question.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {question.difficulty_level && (
                        <span>Difficulty: {question.difficulty_level}/10</span>
                      )}
                      {question.tags && question.tags.length > 0 && (
                        <span>Tags: {question.tags.join(", ")}</span>
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
                <Button onClick={() => router.push("/questions")}>
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
