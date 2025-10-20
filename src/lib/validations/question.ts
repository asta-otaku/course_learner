import { z } from 'zod';
import type { Database } from '../database.types';

// Type aliases for cleaner code
type QuestionType = Database['public']['Enums']['question_type'];

// Base schema for all questions
export const baseQuestionSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['multiple_choice', 'true_false', 'free_text', 'matching', 'matching_pairs'] as const),
  time_limit: z.number().min(0).nullable().optional(),
  hint: z.string().nullable().optional(),
  correct_feedback: z.string().nullable().optional(),
  incorrect_feedback: z.string().nullable().optional(),
  is_public: z.boolean().default(false),
  image_url: z.string().nullable().optional(),
  metadata: z.object({
    matching_pairs: z.array(z.any()).optional(),
  }).passthrough().nullable().optional(),
  matching_pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  grade_id: z.string().uuid().nullable().optional(),
});

// Answer schema for multiple choice questions
export const multipleChoiceAnswerSchema = z.object({
  content: z.string().min(1, 'Answer content is required'),
  is_correct: z.boolean(),
  order_index: z.number().nullable().optional(),
});

// Multiple choice question schema
export const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  answers: z.array(multipleChoiceAnswerSchema)
    .min(2, 'Multiple choice questions require at least 2 answers')
    .max(10, 'Multiple choice questions can have at most 10 answers')
    .refine(
      (answers) => answers.some(a => a.is_correct),
      'At least one answer must be marked as correct'
    ),
});

// True/False question schema (special case of multiple choice)
export const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('true_false'),
  answers: z.array(multipleChoiceAnswerSchema)
    .length(2, 'True/False questions must have exactly 2 answers')
    .refine(
      (answers) => {
        const contents = answers.map(a => a.content.toLowerCase());
        return contents.includes('true') && contents.includes('false');
      },
      'True/False questions must have "True" and "False" as answers'
    )
    .refine(
      (answers) => answers.filter(a => a.is_correct).length === 1,
      'Exactly one answer must be marked as correct'
    ),
});

// Free text schema
export const freeTextQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('free_text'),
  acceptedAnswers: z.array(z.object({
    content: z.string().min(1, 'Answer content is required'),
    grading_criteria: z.string().nullable().optional(),
  }))
    .min(1, 'At least one accepted answer is required')
    .max(20, 'Maximum 20 accepted answers allowed'),
});

// Matching pair schema
export const matchingPairSchema = z.object({
  id: z.string(),
  left: z.string().min(1, 'Left side content is required'),
  right: z.string().min(1, 'Right side content is required'),
});

// Matching question schema
export const matchingQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('matching_pairs'),
  matching_pairs: z.array(matchingPairSchema)
    .min(2, 'At least 2 pairs are required')
    .max(10, 'Maximum 10 pairs allowed'),
});

// Union schema for all question types
export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  freeTextQuestionSchema,
  matchingQuestionSchema,
]);

// Schema for question filters
export const questionFilterSchema = z.object({
  search: z.string().optional(),
  type: z.array(z.enum(['multiple_choice', 'true_false', 'free_text', 'matching_pairs'] as const)).optional(),
  is_public: z.boolean().optional(),
  created_by: z.string().uuid().optional(),
  collection_id: z.string().uuid().optional(),
  folder_id: z.string().uuid().nullable().optional(), // null means root level
  category_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  // Date filters
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(20),
  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'type']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema for updating questions (all fields optional except id)
export const updateQuestionSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).optional(),
  type: z.enum(['multiple_choice', 'true_false', 'free_text', 'matching'] as const).optional(),
  time_limit: z.number().min(0).nullable().optional(),
  hint: z.string().nullable().optional(),
  correct_feedback: z.string().nullable().optional(),
  incorrect_feedback: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  image_url: z.string().nullable().optional(),
  metadata: z.object({
    matching_pairs: z.array(z.any()).optional(),
  }).passthrough().nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  grade_id: z.string().uuid().nullable().optional(),
  // Type-specific fields
  answers: z.array(multipleChoiceAnswerSchema).optional(),
  acceptedAnswers: z.array(z.object({
    content: z.string().min(1),
    grading_criteria: z.string().nullable().optional(),
  })).optional(),
  matching_pairs: z.array(matchingPairSchema).optional(),
});

// Export TypeScript types
export type BaseQuestion = z.infer<typeof baseQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof trueFalseQuestionSchema>;
export type FreeTextQuestion = z.infer<typeof freeTextQuestionSchema>;
export type MatchingQuestion = z.infer<typeof matchingQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionFilter = z.infer<typeof questionFilterSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type MatchingPair = z.infer<typeof matchingPairSchema>;