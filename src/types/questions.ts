// Question type definitions based on the database schema and requirements

export interface BaseQuestion {
  id?: string;
  type: 'multiple_choice' | 'free_text' | 'matching' | 'ordering';
  title?: string;
  content?: string;
  points?: number;
  hint?: string;
  explanation?: string;
  timeLimit?: number; // in seconds
  metadata?: Record<string, any>;
}

// Multiple Choice Question (2-6 options)
export interface MultipleChoiceOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
  allowMultiple?: boolean;
}

// Free Text Question (multiple accepted answers, case sensitivity)
export interface FreeTextQuestion extends BaseQuestion {
  type: 'free_text';
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  useRegex?: boolean;
  allowPartialMatch?: boolean;
  minLength?: number;
  maxLength?: number;
  answerHint?: string;
  answerVariations?: Record<string, string[]>;
}

// Matching Question (2-8 pairs)
export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  alternates?: string[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: MatchingPair[];
  bidirectional?: boolean;
}

// Ordering Question (3-10 items)
export interface OrderingItem {
  id: string;
  content: string;
  order: number;
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  items: OrderingItem[];
  allowPartialCredit?: boolean;
  orderingType?: 'sequential' | 'chronological' | 'logical' | 'custom';
}

// Union type for all questions
export type Question = MultipleChoiceQuestion | FreeTextQuestion | MatchingQuestion | OrderingQuestion;

// User answer types
export interface MultipleChoiceAnswer {
  questionId: string;
  selectedOptions: string[];
}

export interface FreeTextAnswer {
  questionId: string;
  textAnswer: string;
}

export interface MatchingAnswer {
  questionId: string;
  matches: Array<{
    leftId: string;
    rightId: string;
  }>;
}

export interface OrderingAnswer {
  questionId: string;
  orderedItems: string[]; // Array of item IDs in user's order
}

export type UserAnswer = MultipleChoiceAnswer | FreeTextAnswer | MatchingAnswer | OrderingAnswer;

// Validation helpers
export function isMultipleChoiceQuestion(question: Question): question is MultipleChoiceQuestion {
  return question.type === 'multiple_choice';
}

export function isFreeTextQuestion(question: Question): question is FreeTextQuestion {
  return question.type === 'free_text';
}

export function isMatchingQuestion(question: Question): question is MatchingQuestion {
  return question.type === 'matching';
}

export function isOrderingQuestion(question: Question): question is OrderingQuestion {
  return question.type === 'ordering';
}

// Editor props types
export interface QuestionEditorProps<T extends Question> {
  value: T;
  onChange: (value: T) => void;
  showErrors?: boolean;
  disabled?: boolean;
}

export interface QuestionPreviewProps {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
  userAnswer?: UserAnswer;
  showAnswer?: boolean;
  questionNumber?: number;
  disabled?: boolean;
}