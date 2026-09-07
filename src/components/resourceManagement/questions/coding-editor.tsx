'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Code2, Eye, EyeOff } from 'lucide-react';
// Define types locally since they're not in validations
interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

interface CodingQuestion {
  testCases?: TestCase[];
  starterCode?: string;
  language?: string;
  sampleSolution?: string;
}

interface CodingEditorProps {
  question?: Partial<CodingQuestion>;
  onChange: (data: Partial<CodingQuestion>) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export function CodingEditor({ question, onChange }: CodingEditorProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(
    question?.testCases || [{ input: '', expectedOutput: '', isHidden: false }]
  );
  const [starterCode, setStarterCode] = useState(question?.starterCode || '');
  const [sampleSolution, setSampleSolution] = useState(question?.sampleSolution || '');
  const [language, setLanguage] = useState(question?.language || 'javascript');

  const handleAddTestCase = () => {
    const newTestCases = [...testCases, { input: '', expectedOutput: '', isHidden: false }];
    setTestCases(newTestCases);
    updateQuestion(newTestCases, starterCode, language, sampleSolution);
  };

  const handleRemoveTestCase = (index: number) => {
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
    updateQuestion(newTestCases, starterCode, language, sampleSolution);
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
    const newTestCases = [...testCases];
    const currentTestCase = newTestCases[index];
    if (currentTestCase) {
      newTestCases[index] = { ...currentTestCase, [field]: value };
      setTestCases(newTestCases);
      updateQuestion(newTestCases, starterCode, language, sampleSolution);
    }
  };

  const updateQuestion = (
    cases: TestCase[],
    starter: string,
    lang: string,
    solution: string
  ) => {
    onChange({
      testCases: cases,
      starterCode: starter || undefined,
      language: lang,
      sampleSolution: solution || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="language">Programming Language</Label>
        <Select value={language} onValueChange={(value) => {
          setLanguage(value);
          updateQuestion(testCases, starterCode, value, sampleSolution);
        }}>
          <SelectTrigger id="language" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="starter-code">Starter Code (optional)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Provide initial code that students will start with
        </p>
        <Textarea
          id="starter-code"
          value={starterCode}
          onChange={(e) => {
            setStarterCode(e.target.value);
            updateQuestion(testCases, e.target.value, language, sampleSolution);
          }}
          placeholder={`// Write your ${language} code here
function solve(input) {
  // Your code here
}`}
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Test Cases</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTestCase}
            disabled={testCases.length >= 50}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Test Case
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Define input/output pairs to test student submissions
        </p>
        
        <div className="space-y-4">
          {testCases.map((testCase, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Test Case {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`hidden-${index}`}
                        checked={testCase.isHidden}
                        onCheckedChange={(checked) => 
                          handleTestCaseChange(index, 'isHidden', checked)
                        }
                      />
                      <Label htmlFor={`hidden-${index}`} className="text-sm cursor-pointer">
                        {testCase.isHidden ? (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        )}
                      </Label>
                    </div>
                    {testCases.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTestCase(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor={`input-${index}`}>Input</Label>
                  <Textarea
                    id={`input-${index}`}
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    placeholder="Enter test input..."
                    rows={3}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor={`output-${index}`}>Expected Output</Label>
                  <Textarea
                    id={`output-${index}`}
                    value={testCase.expectedOutput}
                    onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                    placeholder="Enter expected output..."
                    rows={3}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`description-${index}`}>Description (optional)</Label>
                    <Input
                      id={`description-${index}`}
                      value={testCase.description || ''}
                      onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                      placeholder="e.g., 'Empty array'"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="sample-solution">Sample Solution (optional)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Provide a reference solution for instructors
        </p>
        <Textarea
          id="sample-solution"
          value={sampleSolution}
          onChange={(e) => {
            setSampleSolution(e.target.value);
            updateQuestion(testCases, starterCode, language, e.target.value);
          }}
          placeholder="Enter a complete solution..."
          rows={10}
          className="font-mono text-sm"
        />
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          Coding Questions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Code is executed in a secure sandbox environment</li>
          <li>Hidden test cases help prevent hardcoded solutions</li>
          <li>Execution time and memory limits are enforced</li>
          <li>Students can test their code before submission</li>
        </ul>
      </div>
    </div>
  );
}