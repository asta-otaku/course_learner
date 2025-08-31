'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import type { FreeTextQuestion } from '@/lib/validations/question';

interface FreeTextEditorProps {
  question?: Partial<FreeTextQuestion>;
  onChange: (data: Partial<FreeTextQuestion>) => void;
}

export function FreeTextEditor({ question, onChange }: FreeTextEditorProps) {
  const [acceptedAnswers, setAcceptedAnswers] = useState<Array<{ content: string; grading_criteria?: string }>>(
    question?.acceptedAnswers?.map(ans => ({
      content: ans.content || '',
      grading_criteria: ans.grading_criteria
    })) || [{ content: '' }]
  );

  const handleAddAnswer = () => {
    const newAnswers = [...acceptedAnswers, { content: '' }];
    setAcceptedAnswers(newAnswers);
    onChange({ type: 'free_text', acceptedAnswers: newAnswers });
  };

  const handleRemoveAnswer = (index: number) => {
    const newAnswers = acceptedAnswers.filter((_, i) => i !== index);
    setAcceptedAnswers(newAnswers);
    onChange({ type: 'free_text', acceptedAnswers: newAnswers });
  };

  const handleAnswerChange = (index: number, content: string) => {
    const newAnswers = [...acceptedAnswers];
    newAnswers[index] = { ...newAnswers[index], content };
    setAcceptedAnswers(newAnswers);
    onChange({ type: 'free_text', acceptedAnswers: newAnswers });
  };

  const handleCriteriaChange = (index: number, grading_criteria: string) => {
    const newAnswers = [...acceptedAnswers];
    newAnswers[index] = { ...newAnswers[index], grading_criteria: grading_criteria || undefined };
    setAcceptedAnswers(newAnswers);
    onChange({ type: 'free_text', acceptedAnswers: newAnswers });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Accepted Answers</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Add one or more accepted answers. Students&apos; responses will be matched against these.
        </p>
        <div className="space-y-4">
          {acceptedAnswers.map((answer, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Input
                  value={answer.content}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Enter an accepted answer"
                  className="flex-1"
                />
                {acceptedAnswers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAnswer(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor={`criteria-${index}`} className="text-sm text-muted-foreground">
                  Grading Criteria (optional)
                </Label>
                <Textarea
                  id={`criteria-${index}`}
                  value={answer.grading_criteria || ''}
                  onChange={(e) => handleCriteriaChange(index, e.target.value)}
                  placeholder="Describe specific criteria for accepting this answer..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAddAnswer}
        disabled={acceptedAnswers.length >= 20}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Answer
      </Button>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Free text questions are automatically graded based on exact matches.
          You can add multiple accepted answers and optional grading criteria for each.
          Answers are case-insensitive and trimmed of extra whitespace.
        </p>
      </div>
    </div>
  );
}