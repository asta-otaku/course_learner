import { describe, it, expect } from 'vitest'
import { createLessonSchema, updateLessonSchema } from '@/lib/validations/lesson'

describe('Lesson Validation', () => {
  describe('createLessonSchema', () => {
    it('should validate with only required fields', () => {
      const data = {
        title: 'Introduction to Algebra',
        curriculum_id: '123e4567-e89b-12d3-a456-426614174000',
        learning_objectives: ['Understand basic algebraic concepts'],
        tags: ['algebra', 'basics']
      }
      
      const result = createLessonSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Introduction to Algebra')
        expect(result.data.learning_objectives).toEqual(['Understand basic algebraic concepts'])
        expect(result.data.tags).toEqual(['algebra', 'basics'])
        // Check defaults
        expect(result.data.is_published).toBe(false)
        expect(result.data.is_public).toBe(false)
      }
    })

    it('should work with minimal data', () => {
      const data = {
        title: 'Test Lesson',
        curriculum_id: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const result = createLessonSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.learning_objectives).toEqual([])
        expect(result.data.tags).toEqual([])
      }
    })

    it('should fail without required fields', () => {
      const data = {
        learning_objectives: ['Some objective']
      }
      
      const result = createLessonSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('updateLessonSchema', () => {
    it('should allow partial updates', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Title',
        tags: ['new-tag']
      }
      
      const result = updateLessonSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Title')
        expect(result.data.tags).toEqual(['new-tag'])
      }
    })

    it('should allow updating just tags', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tags: ['math', 'advanced']
      }
      
      const result = updateLessonSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})