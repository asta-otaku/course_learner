'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { ApiResponse, APIGetResponse } from '@/lib/types';
import { z } from 'zod';

// Validation schemas
const createCurriculumSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

const createLessonSchema = z.object({
  curriculumId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  orderIndex: z.number().min(0),
  durationMinutes: z.number().optional(),
  objectives: z.array(z.string()).optional(),
  quizId: z.string().uuid().optional(),
});

export type CreateCurriculumInput = z.infer<typeof createCurriculumSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

// Type definitions for responses
export type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Curriculum actions
export async function createCurriculum(input: CreateCurriculumInput): Promise<ActionResponse<any>> {
  try {
    const validatedData = createCurriculumSchema.parse(input);
    
    const response = await axiosInstance.post('/curricula', {
      title: validatedData.title,
      description: validatedData.description ?? null,
      category_id: validatedData.categoryId ?? null,
      objectives: validatedData.objectives ?? null,
      prerequisites: validatedData.prerequisites ?? null,
      is_public: validatedData.isPublic || false,
    });

    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/curricula');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to create curriculum' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Invalid input data';
    return { success: false, error: errorMessage };
  }
}

export async function getCategories(): Promise<any[]> {
  try {
    const response = await axiosInstance.get('/categories?is_active=true');
    const result: APIGetResponse<any[]> = response.data;
    
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCurricula(): Promise<any[]> {
  try {
    const response = await axiosInstance.get('/curricula');
    const result: APIGetResponse<any[]> = response.data;
    
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching curricula:', error);
    return [];
  }
}

// Reorder curricula
export async function reorderCurricula(curriculumIds: string[]): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.patch('/curricula/reorder', {
      curriculum_ids: curriculumIds,
    });

    revalidatePath('/curricula');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to reorder curricula';
    return { success: false, error: errorMessage };
  }
}

export async function getCurriculum(id: string): Promise<any | null> {
  try {
    const response = await axiosInstance.get(`/curricula/${id}`);
    const result: APIGetResponse<any> = response.data;
    
    return result.data;
  } catch (error: any) {
    console.error('Error fetching curriculum:', error);
    return null;
  }
}

export async function updateCurriculum(id: string, input: Partial<CreateCurriculumInput>): Promise<ActionResponse<any>> {
  try {
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
    if (input.objectives !== undefined) updateData.objectives = input.objectives;
    if (input.prerequisites !== undefined) updateData.prerequisites = input.prerequisites;
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic;

    const response = await axiosInstance.put(`/curricula/${id}`, updateData);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/curricula');
      revalidatePath(`/curricula/${id}`);
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to update curriculum' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Invalid input data';
    return { success: false, error: errorMessage };
  }
}

export async function toggleCurriculumVisibility(id: string): Promise<ActionResponse<any>> {
  try {
    const response = await axiosInstance.patch(`/curricula/${id}/toggle-visibility`);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/curricula');
      revalidatePath(`/curricula/${id}`);
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Curriculum not found' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update curriculum visibility';
    return { success: false, error: errorMessage };
  }
}

export async function deleteCurriculum(id: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.delete(`/curricula/${id}`);

    revalidatePath('/curricula');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete curriculum';
    return { success: false, error: errorMessage };
  }
}

// Lesson actions
export async function createLesson(input: {
  curriculum_id: string;
  title: string;
  description?: string;
  content?: string;
  duration_minutes?: number;
}): Promise<ActionResponse<any>> {
  try {
    const response = await axiosInstance.post('/lessons', input);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/curricula');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to create lesson' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create lesson';
    return { success: false, error: errorMessage };
  }
}

export async function updateLesson(id: string, input: {
  title?: string;
  description?: string;
  content?: string;
  duration_minutes?: number;
  order_index?: number;
}): Promise<ActionResponse<any>> {
  try {
    const response = await axiosInstance.put(`/lessons/${id}`, input);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/curricula');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to update lesson' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update lesson';
    return { success: false, error: errorMessage };
  }
}

export async function deleteLesson(id: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.delete(`/lessons/${id}`);
    
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete lesson';
    return { success: false, error: errorMessage };
  }
}