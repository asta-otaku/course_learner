import { z } from 'zod'

export const collectionSchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 character').max(100),
  description: z.string().max(500).optional(),
})

export const collectionUpdateSchema = collectionSchema.partial()

export const addQuestionToCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  questionId: z.string().uuid(),
})

export const reorderQuestionsSchema = z.object({
  collectionId: z.string().uuid(),
  questionOrders: z.array(z.object({
    questionId: z.string().uuid(),
    orderIndex: z.number().int().min(0),
  })),
})

export type CollectionInput = z.infer<typeof collectionSchema>
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>
export type AddQuestionToCollectionInput = z.infer<typeof addQuestionToCollectionSchema>
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>