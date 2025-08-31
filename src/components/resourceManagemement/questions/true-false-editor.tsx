'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import type { TrueFalseQuestion } from '@/lib/validations/question';

interface TrueFalseEditorProps {
  question?: Partial<TrueFalseQuestion>;
  onChange: (data: Partial<TrueFalseQuestion>) => void;
}

export function TrueFalseEditor({ question, onChange }: TrueFalseEditorProps) {
  // Initialize with True/False answers
  const [correctAnswer, setCorrectAnswer] = useState<'true' | 'false'>(
    question?.answers?.find(a => a.is_correct)?.content.toLowerCase() === 'true' ? 'true' : 'false'
  );
  

  const handleAnswerChange = (value: 'true' | 'false') => {
    setCorrectAnswer(value);
    updateQuestion(value);
  };


  const updateQuestion = (correct: 'true' | 'false') => {
    const answers = [
      {
        content: 'True',
        is_correct: correct === 'true',
        order_index: 0,
      },
      {
        content: 'False',
        is_correct: correct === 'false',
        order_index: 1,
      },
    ];

    onChange({
      type: 'true_false',
      answers,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="correct-answer">Correct Answer</Label>
        <RadioGroup
          id="correct-answer"
          value={correctAnswer}
          onValueChange={(value) => handleAnswerChange(value as 'true' | 'false')}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">False</Label>
          </div>
        </RadioGroup>
      </div>

    </div>
  );
}