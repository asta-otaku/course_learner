import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestion, updateQuestion, getQuestionById } from '../';
import { createServerClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Question Image Functionality', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createServerClient as any).mockResolvedValue(mockSupabase);
  });

  describe('createQuestion with image', () => {
    it('should create a question with an image URL', async () => {
      const mockQuestion = {
        id: 'question-123',
        title: 'Test Question with Image',
        content: 'What is shown in the image?',
        type: 'multiple_choice',
        image_url: 'https://example.com/test-image.jpg',
        created_by: mockUser.id,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'teacher' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockQuestion,
              error: null,
            }),
          }),
        }),
      });

      const result = await createQuestion({
        title: 'Test Question with Image',
        content: 'What is shown in the image?',
        type: 'multiple_choice',
        image_url: 'https://example.com/test-image.jpg',
        answers: [
          { content: 'Option A', is_correct: true },
          { content: 'Option B', is_correct: false },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Test Question with Image',
        image_url: 'https://example.com/test-image.jpg',
      });
    });

    it('should create a question without an image URL', async () => {
      const mockQuestion = {
        id: 'question-456',
        title: 'Test Question without Image',
        content: 'Simple text question',
        type: 'true_false',
        image_url: null,
        created_by: mockUser.id,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'teacher' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockQuestion,
              error: null,
            }),
          }),
        }),
      });

      const result = await createQuestion({
        title: 'Test Question without Image',
        content: 'Simple text question',
        type: 'true_false',
        answers: [
          { content: 'True', is_correct: true },
          { content: 'False', is_correct: false },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Test Question without Image',
        image_url: null,
      });
    });
  });

  describe('updateQuestion with image', () => {
    it('should update a question with a new image URL', async () => {
      const mockExistingQuestion = {
        id: 'question-789',
        created_by: mockUser.id,
      };

      const mockUpdatedQuestion = {
        ...mockExistingQuestion,
        title: 'Updated Question',
        image_url: 'https://example.com/new-image.jpg',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockExistingQuestion,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updateQuestion({
        id: 'question-789',
        title: 'Updated Question',
        image_url: 'https://example.com/new-image.jpg',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Updated Question',
        image_url: 'https://example.com/new-image.jpg',
      });
    });

    it('should remove image URL when set to null', async () => {
      const mockExistingQuestion = {
        id: 'question-999',
        created_by: mockUser.id,
        image_url: 'https://example.com/old-image.jpg',
      };

      const mockUpdatedQuestion = {
        ...mockExistingQuestion,
        image_url: null,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockExistingQuestion,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updateQuestion({
        id: 'question-999',
        image_url: null,
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        image_url: null,
      });
    });
  });
});