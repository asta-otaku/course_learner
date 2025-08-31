'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { Question, QuestionQueryOptions, ApiResponse, APIGetResponse } from '@/lib/types';
import {
  questionSchema,
  updateQuestionSchema,
  questionFilterSchema,
  type QuestionFilter,
  type UpdateQuestion,
} from '@/lib/validations/question';

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

export async function createQuestion(data: any): Promise<ActionResponse<Question>> {
  try {
    // Validate input
    const validation = questionSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}` };
    }

    const response = await axiosInstance.post('/questions', validation.data);
    const result: ApiResponse<Question> = response.data;

    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Failed to create question' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function updateQuestion(data: UpdateQuestion): Promise<ActionResponse<Question>> {
  try {
    // Validate input
    const validation = updateQuestionSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const { id, ...updateData } = validation.data;

    const response = await axiosInstance.put(`/questions/${id}`, updateData);
    const result: ApiResponse<Question> = response.data;

    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Question not found' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function deleteQuestion(id: string, cascade: boolean = false): Promise<ActionResponse<void>> {
  try {
    const url = cascade ? `/questions/${id}?cascade=true` : `/questions/${id}`;
    await axiosInstance.delete(url);

    revalidatePath('/questions');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function getQuestions(filters: Partial<QuestionFilter> = {}): Promise<ActionResponse<{
  questions: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  try {
    // Apply defaults
    const filtersWithDefaults = {
      page: 1,
      limit: 20,
      sortBy: 'created_at' as const,
      sortOrder: 'desc' as const,
      ...filters
    };
    
    // Validate filters
    const validation = questionFilterSchema.safeParse(filtersWithDefaults);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Invalid filters' };
    }

    const validatedFilters = validation.data;
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (validatedFilters.search) params.append('search', validatedFilters.search);
    if (validatedFilters.type && validatedFilters.type.length > 0) {
      validatedFilters.type.forEach(t => params.append('type', t));
    }
    if (validatedFilters.dateFrom) params.append('dateFrom', validatedFilters.dateFrom);
    if (validatedFilters.dateTo) params.append('dateTo', validatedFilters.dateTo);
    if (validatedFilters.folder_id !== undefined) {
      if (validatedFilters.folder_id === null) {
        params.append('folderId', 'null');
      } else {
        params.append('folderId', validatedFilters.folder_id);
      }
    }
    if (validatedFilters.is_public !== undefined) params.append('isPublic', validatedFilters.is_public.toString());
    if (validatedFilters.created_by) params.append('createdBy', validatedFilters.created_by);
    if (validatedFilters.category_id) params.append('categoryId', validatedFilters.category_id);
    if (validatedFilters.grade_id) params.append('gradeId', validatedFilters.grade_id);
    if (validatedFilters.collection_id) params.append('collectionId', validatedFilters.collection_id);
    
    params.append('page', validatedFilters.page.toString());
    params.append('limit', validatedFilters.limit.toString());
    params.append('sortBy', validatedFilters.sortBy);
    params.append('sortOrder', validatedFilters.sortOrder.toUpperCase());

    const queryString = params.toString();
    const url = queryString ? `/questions?${queryString}` : '/questions';

    const response = await axiosInstance.get(url);
    const result: APIGetResponse<{
      questions: Question[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }> = response.data;

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function getQuestionById(id: string): Promise<ActionResponse<{
  question: Question;
  answers: any[];
}>> {
  try {
    const response = await axiosInstance.get(`/questions/${id}`);
    const result: APIGetResponse<{
      question: Question;
      answers: any[];
    }> = response.data;

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Question not found';
    return { success: false, error: errorMessage };
  }
}

export async function duplicateQuestion(questionId: string): Promise<ActionResponse<Question>> {
  try {
    const response = await axiosInstance.post(`/questions/${questionId}/duplicate`);
    const result: ApiResponse<Question> = response.data;

    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Failed to duplicate question' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to duplicate question';
    return { success: false, error: errorMessage };
  }
}

export async function bulkMoveQuestions(
  questionIds: string[],
  targetFolderId: string | null
): Promise<ActionResponse<{ movedCount: number }>> {
  try {
    const response = await axiosInstance.patch('/questions/bulk-move', {
      questionIds,
      targetFolderId
    });
    const result: ApiResponse<{ movedCount: number }> = response.data;

    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Failed to move questions' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to move questions';
    return { success: false, error: errorMessage };
  }
}

export async function bulkDeleteQuestions(
  questionIds: string[]
): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const response = await axiosInstance.delete('/questions/bulk-delete', {
      data: { questionIds }
    });
    const result: ApiResponse<{ deletedCount: number }> = response.data;

    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }

    return { success: false, error: 'Failed to delete questions' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete questions';
    return { success: false, error: errorMessage };
  }
}

export async function getAllQuestionIds(filters: Partial<QuestionFilter> = {}): Promise<ActionResponse<string[]>> {
  try {
    // Build query parameters similar to getQuestions but request only IDs
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach(t => params.append('type', t));
    }
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null) {
        params.append('folderId', 'null');
      } else {
        params.append('folderId', filters.folder_id);
      }
    }
    if (filters.is_public !== undefined) params.append('isPublic', filters.is_public.toString());
    if (filters.created_by) params.append('createdBy', filters.created_by);
    if (filters.collection_id) params.append('collectionId', filters.collection_id);
    
    params.append('sortBy', filters.sortBy || 'created_at');
    params.append('sortOrder', (filters.sortOrder || 'desc').toUpperCase());
    params.append('idsOnly', 'true'); // Request only IDs

    const queryString = params.toString();
    const url = `/questions/ids?${queryString}`;

    const response = await axiosInstance.get(url);
    const result: APIGetResponse<string[]> = response.data;

    return { success: true, data: result.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}