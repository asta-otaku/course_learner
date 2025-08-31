import { z } from 'zod';
import type { Database } from '../database.types';

// Base lesson schema - simplified
export const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  curriculum_id: z.string().uuid('Valid curriculum ID is required'),
  learning_objectives: z.array(z.string()).default([]),
  tags: z.array(z.string()).optional().default([]), // New tags field
  // Fields with defaults (not shown in form)
  description: z.string().optional().nullable().default(null),
  content: z.string().optional().nullable().default(null),
  order_index: z.number().int().min(0).optional(), // Will be auto-calculated
  duration_minutes: z.number().int().min(1).optional().nullable().default(null),
  difficulty_level: z.number().int().min(1).max(5).optional().nullable().default(null),
  prerequisites: z.array(z.string()).optional().nullable().default(null),
  resources: z.record(z.any()).optional().nullable().default(null),
  is_published: z.boolean().default(false),
  is_public: z.boolean().default(false),
  metadata: z.record(z.any()).optional().nullable().default(null),
  activities: z.record(z.any()).optional().nullable().default(null),
  quiz_id: z.string().uuid().optional().nullable().default(null),
  section_id: z.string().uuid().optional().nullable().default(null),
});

// Schema for creating a new lesson
export const createLessonSchema = lessonSchema;

// Schema for updating a lesson
export const updateLessonSchema = lessonSchema.partial().extend({
  id: z.string().uuid('Valid lesson ID is required'),
});

// Schema for lesson filters
export const lessonFilterSchema = z.object({
  curriculum_id: z.string().uuid().optional(),
  is_published: z.boolean().optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['title', 'order_index', 'created_at', 'updated_at', 'difficulty_level']).default('order_index'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Schema for reordering lessons
export const reorderLessonsSchema = z.object({
  curriculum_id: z.string().uuid('Valid curriculum ID is required'),
  lesson_orders: z.array(z.object({
    id: z.string().uuid('Valid lesson ID is required'),
    order_index: z.number().int().min(0),
  })),
});

// Schema for lesson progress tracking
export const lessonProgressSchema = z.object({
  lesson_id: z.string().uuid('Valid lesson ID is required'),
  user_id: z.string().uuid('Valid user ID is required'),
  completed: z.boolean().default(false),
  completion_date: z.string().datetime().optional().nullable(),
  time_spent_minutes: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Type exports
export type Lesson = z.infer<typeof lessonSchema>;
export type CreateLesson = z.infer<typeof createLessonSchema>;
export type UpdateLesson = z.infer<typeof updateLessonSchema>;
export type LessonFilter = z.infer<typeof lessonFilterSchema>;
export type ReorderLessons = z.infer<typeof reorderLessonsSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;

// Database types
export type LessonRow = Database['public']['Tables']['lessons']['Row'];
export type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
export type LessonUpdate = Database['public']['Tables']['lessons']['Update'];