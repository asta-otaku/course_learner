import { z } from 'zod'

export const quizSettingsSchema = z.object({
  timeLimit: z.number().min(0).max(180), // in minutes
  randomizeQuestions: z.boolean(),
  showCorrectAnswers: z.boolean(),
  maxAttempts: z.number().min(1),
  passingScore: z.number().min(0).max(100),
  showFeedback: z.boolean(),
  allowRetakes: z.boolean(),
  allowReview: z.boolean(),
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  preventSkipping: z.boolean().default(false),
})

export const quizQuestionSchema = z.object({
  questionId: z.string(),
  order: z.number().min(1),
  pointsOverride: z.number().min(0),
  required: z.boolean(),
})

export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  gradeId: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: quizSettingsSchema.partial().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  questions: z.array(quizQuestionSchema).optional(),
})

export const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  settings: quizSettingsSchema.optional(),
  questions: z.array(quizQuestionSchema).optional(),
})

export const saveQuizSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  instructions: z.string(),
  categoryId: z.string().uuid(),
  gradeId: z.string().uuid(),
  lessonId: z.string().uuid(),
  tags: z.array(z.string()),
  questions: z.array(quizQuestionSchema),
  settings: quizSettingsSchema,
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
export type QuizProgress = z.infer<typeof quizProgressSchema>
export type ScheduleQuizInput = z.infer<typeof scheduleQuizSchema>