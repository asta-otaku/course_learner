'use client';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FreeTextInputProps {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  minHeight?: string;
  placeholder?: string;
}

export function FreeTextInput({
  questionId,
  value,
  onChange,
  disabled = false,
  maxLength = 2000,
  minHeight = '120px',
  placeholder = 'Type your answer here...'
}: FreeTextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="space-y-2">
      <Textarea
        id={`question-${questionId}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "resize-none transition-colors",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          disabled && "opacity-60 cursor-not-allowed bg-gray-50"
        )}
        style={{ minHeight }}
        aria-label="Free text answer"
        aria-describedby={`char-count-${questionId}`}
      />
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {disabled ? 'Answer submitted' : 'Enter your answer above'}
        </span>
        <span
          id={`char-count-${questionId}`}
          className={cn(
            "transition-colors",
            isNearLimit ? "text-orange-600 font-medium" : "text-gray-500",
            characterCount >= maxLength && "text-red-600 font-semibold"
          )}
          aria-live="polite"
        >
          {characterCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}