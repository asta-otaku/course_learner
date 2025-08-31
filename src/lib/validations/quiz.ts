import { z } from 'zod'

export const quizSettingsSchema = z.object({
  timeLimit: z.number().min(0).max(180).optional(), // in minutes
  randomizeQuestions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
  passingScore: z.number().min(0).max(100).default(70),
  showFeedback: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  preventSkipping: z.boolean().default(false), // When true: students must answer each question before moving to the next
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
  examMode: z.boolean().default(false), // When true: enforces time limits, no going back, no review until after submission
})

export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  questionId: z.string(),
  order: z.number().min(0),
})

export const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: quizSettingsSchema.optional(),
})

export const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: quizSettingsSchema.optional(),
  questions: z.array(quizQuestionSchema).optional(),
})

export const saveQuizSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  questions: z.array(quizQuestionSchema),
  settings: quizSettingsSchema.optional(),
})

export const submitQuizAttemptSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])),
  timeSpent: z.number().min(0), // in seconds
})

export const quizProgressSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])),
  currentQuestion: z.number().min(0),
  timeRemaining: z.number().optional(), // in seconds
})

export const scheduleQuizSchema = z.object({
  availableFrom: z.string().datetime(),
  availableTo: z.string().datetime(),
})

// Type exports
export type QuizSettings = z.infer<typeof quizSettingsSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
export type SaveQuizInput = z.infer<typeof saveQuizSchema>
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>
export type QuizProgress = z.infer<typeof quizProgressSchema>
export type ScheduleQuizInput = z.infer<typeof scheduleQuizSchema>