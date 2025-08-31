'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { ApiResponse, APIGetResponse } from '@/lib/types';
import {
  lessonSchema,
  createLessonSchema,
  updateLessonSchema,
  lessonFilterSchema,
  reorderLessonsSchema,
  type LessonRow,
  type CreateLesson,
  type UpdateLesson,
  type LessonFilter,
  type ReorderLessons,
} from '@/lib/validations/lesson';

// Type definitions for responses
export type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Create a new lesson
export async function createLesson(data: CreateLesson): Promise<ActionResponse<LessonRow>> {
  try {
    // Validate input
    const validation = createLessonSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}` };
    }

    const validatedData = validation.data;

    const response = await axiosInstance.post('/lessons', {
      title: validatedData.title,
      description: validatedData.description ?? null,
      content: validatedData.content ?? null,
      curriculum_id: validatedData.curriculum_id,
      order_index: validatedData.order_index,
      learning_objectives: validatedData.learning_objectives ?? [],
      duration_minutes: validatedData.duration_minutes ?? null,
      difficulty_level: validatedData.difficulty_level ?? null,
      prerequisites: validatedData.prerequisites ?? null,
      resources: validatedData.resources ?? null,
      is_published: validatedData.is_published,
      is_public: validatedData.is_public,
      tags: validatedData.tags || [],
    });

    const result: ApiResponse<LessonRow> = response.data;

    if (result.data) {
      revalidatePath('/curricula');
      revalidatePath(`/curricula/${validatedData.curriculum_id}`);
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Failed to create lesson' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get lessons for a curriculum
export async function getLessonsForCurriculum(curriculumId: string): Promise<ActionResponse<LessonRow[]>> {
  try {
    const response = await axiosInstance.get(`/curricula/${curriculumId}/lessons`);
    const result: APIGetResponse<LessonRow[]> = response.data;

    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get lessons with quiz counts for a curriculum
export async function getLessonsWithQuizCounts(curriculumId: string): Promise<ActionResponse<Array<{ lesson: LessonRow; quiz_count: number }>>> {
  try {
    const response = await axiosInstance.get(`/curricula/${curriculumId}/lessons?includeQuizCounts=true`);
    const result: APIGetResponse<Array<{ lesson: LessonRow; quiz_count: number }>> = response.data;

    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get a single lesson by ID
export async function getLessonById(id: string): Promise<ActionResponse<{ lesson: LessonRow; quiz_count: number }>> {
  try {
    const response = await axiosInstance.get(`/lessons/${id}?includeQuizCount=true`);
    const result: APIGetResponse<{ lesson: LessonRow; quiz_count: number }> = response.data;

    if (!result.data) {
      return { success: false, error: 'Lesson not found' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Update a lesson
export async function updateLesson(data: UpdateLesson): Promise<ActionResponse<LessonRow>> {
  try {
    // Validate input
    const validation = updateLessonSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}` };
    }

    const validatedData = validation.data;

    const response = await axiosInstance.put(`/lessons/${validatedData.id}`, validatedData);
    const result: ApiResponse<LessonRow> = response.data;

    if (result.data) {
      revalidatePath('/curricula');
      revalidatePath(`/lessons/${validatedData.id}`);
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Lesson not found or access denied' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Delete a lesson
export async function deleteLesson(id: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.delete(`/lessons/${id}`);

    revalidatePath('/curricula');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Reorder lessons within a curriculum
export async function reorderLessons(data: ReorderLessons): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validation = reorderLessonsSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}` };
    }

    const validatedData = validation.data;

    await axiosInstance.patch(`/curricula/${validatedData.curriculum_id}/lessons/reorder`, {
      lesson_orders: validatedData.lesson_orders
    });

    revalidatePath('/curricula');
    revalidatePath(`/curricula/${validatedData.curriculum_id}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get filtered lessons with pagination
export async function getLessons(filters: LessonFilter): Promise<ActionResponse<PaginatedResponse<LessonRow>>> {
  try {
    // Validate filters
    const validation = lessonFilterSchema.safeParse(filters);
    if (!validation.success) {
      return { success: false, error: `Invalid filters: ${validation.error.errors.map(e => e.message).join(', ')}` };
    }

    const validatedFilters = validation.data;

    // Build query parameters
    const params = new URLSearchParams();
    
    if (validatedFilters.curriculum_id) params.append('curriculum_id', validatedFilters.curriculum_id);
    if (validatedFilters.is_published !== undefined) params.append('is_published', validatedFilters.is_published.toString());
    if (validatedFilters.difficulty_level) params.append('difficulty_level', validatedFilters.difficulty_level.toString());
    if (validatedFilters.search) params.append('search', validatedFilters.search);
    
    params.append('page', validatedFilters.page.toString());
    params.append('limit', validatedFilters.limit.toString());
    params.append('sortBy', validatedFilters.sortBy);
    params.append('sortOrder', validatedFilters.sortOrder.toUpperCase());

    const response = await axiosInstance.get(`/lessons?${params.toString()}`);
    const result: APIGetResponse<PaginatedResponse<LessonRow>> = response.data;

    return { success: true, data: result.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get lessons by tag
export async function getLessonsByTag(tag: string): Promise<ActionResponse<LessonRow[]>> {
  try {
    const response = await axiosInstance.get(`/lessons?tag=${encodeURIComponent(tag)}`);
    const result: APIGetResponse<LessonRow[]> = response.data;

    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Get all unique tags from lessons
export async function getLessonTags(): Promise<ActionResponse<string[]>> {
  try {
    const response = await axiosInstance.get('/lessons/tags');
    const result: APIGetResponse<string[]> = response.data;

    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}

// Update lesson publish status
export async function updateLessonPublishStatus(
  lessonId: string, 
  isPublished: boolean
): Promise<ActionResponse<LessonRow>> {
  try {
    const response = await axiosInstance.patch(`/lessons/${lessonId}/publish`, {
      is_published: isPublished
    });
    
    const result: ApiResponse<LessonRow> = response.data;

    if (result.data) {
      revalidatePath(`/lessons/${lessonId}`);
      revalidatePath('/curricula');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Lesson not found' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    return { success: false, error: errorMessage };
  }
}
