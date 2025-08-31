'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { Quiz, ApiResponse, APIGetResponse } from '@/lib/types';

// Type definitions
export type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export async function createQuiz(input: any): Promise<ActionResponse<Quiz>> {
  try {
    const response = await axiosInstance.post('/quiz', {
      title: input.title,
      description: input.description ?? null,
      lessonId: input.lessonId ?? null,
      tags: input.tags ?? null,
      settings: input.settings ?? null,
      status: 'draft',
    });
    
    const result: ApiResponse<Quiz> = response.data;
    
    if (result.data) {
      revalidatePath('/quizzes');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to create quiz' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Invalid input data';
    return { success: false, error: errorMessage };
  }
}

export async function updateQuiz(id: string, input: any): Promise<ActionResponse<Quiz>> {
  try {
    const response = await axiosInstance.put(`/quiz/${id}`, input);
    const result: ApiResponse<Quiz> = response.data;
    
    if (result.data) {
      revalidatePath('/quizzes');
      revalidatePath(`/quizzes/${id}`);
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to update quiz' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Invalid input data';
    return { success: false, error: errorMessage };
  }
}

export async function updateQuizStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<ActionResponse<Quiz>> {
  try {
    const response = await axiosInstance.patch(`/quiz/${id}/status`, { status });
    const result: ApiResponse<Quiz> = response.data;
    
    if (result.data) {
      revalidatePath('/quizzes');
      revalidatePath(`/quizzes/${id}`);
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to update quiz status' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update quiz status';
    return { success: false, error: errorMessage };
  }
}

export async function deleteQuiz(id: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.delete(`/quiz/${id}`);
    
    revalidatePath('/quizzes');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete quiz';
    return { success: false, error: errorMessage };
  }
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    const response = await axiosInstance.get(`/quiz/${id}`);
    const result: APIGetResponse<Quiz> = response.data;
    
    return result.data;
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    return null;
  }
}

export async function getQuizzes(filters?: {
  categoryId?: string;
  gradeId?: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}): Promise<Quiz[]> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.gradeId) params.append('gradeId', filters.gradeId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = queryString ? `/quiz?${queryString}` : '/quiz';
    
    const response = await axiosInstance.get(url);
    const result: APIGetResponse<Quiz[]> = response.data;
    
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

export async function duplicateQuiz(id: string): Promise<ActionResponse<Quiz>> {
  try {
    const response = await axiosInstance.post(`/quiz/${id}/duplicate`);
    const result: ApiResponse<Quiz> = response.data;
    
    if (result.data) {
      revalidatePath('/quizzes');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to duplicate quiz' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to duplicate quiz';
    return { success: false, error: errorMessage };
  }
}

export async function addQuestionToQuiz(quizId: string, questionId: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.post(`/quiz/${quizId}/questions`, { questionId });
    
    revalidatePath(`/quizzes/${quizId}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add question to quiz';
    return { success: false, error: errorMessage };
  }
}

export async function searchQuizzes(searchTerm: string, quizId?: string): Promise<ActionResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    
    if (quizId) {
      params.append('id', quizId);
    } else if (searchTerm && searchTerm.length >= 2) {
      params.append('search', searchTerm);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/quiz/search?${queryString}` : '/quiz/search';
    
    const response = await axiosInstance.get(url);
    const result: APIGetResponse<any[]> = response.data;
    
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to search quizzes';
    return { success: false, error: errorMessage, data: [] };
  }
}

export async function addQuizToLesson(lessonId: string, quizId: string): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.patch(`/quiz/${quizId}/lesson`, { lessonId });
    
    revalidatePath(`/lessons/${lessonId}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add quiz to lesson';
    return { success: false, error: errorMessage };
  }
}

export async function saveQuiz(input: any): Promise<ActionResponse<{ id: string }>> {
  try {
    const response = await axiosInstance.put(`/quiz/${input.id}/save`, {
      title: input.title,
      description: input.description ?? null,
      settings: input.settings ?? null,
      questions: input.questions,
      explanations: input.explanations,
    });
    
    const result: ApiResponse<{ id: string }> = response.data;
    
    if (result.data) {
      revalidatePath(`/quizzes/${input.id}`);
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to save quiz' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Invalid input data';
    return { success: false, error: errorMessage };
  }
}

export async function submitQuizAttempt(input: any): Promise<ActionResponse<{ attemptId: string; score: number }>> {
  try {
    const response = await axiosInstance.post(`/quiz/${input.quizId}/submit`, {
      answers: input.answers,
      timeSpent: input.timeSpent,
    });
    
    const result: ApiResponse<{ attemptId: string; score: number }> = response.data;
    
    if (result.data) {
      revalidatePath('/quiz-results');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to submit quiz' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to submit quiz';
    return { success: false, error: errorMessage };
  }
}

export async function getQuizzesForLesson(lessonId: string): Promise<ActionResponse<any[]>> {
  try {
    const response = await axiosInstance.get(`/lessons/${lessonId}/quizzes`);
    const result: APIGetResponse<any[]> = response.data;
    
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch quizzes';
    return { success: false, error: errorMessage, data: [] };
  }
}

export async function getQuizAttempts(quizId: string, userId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    params.append('quizId', quizId);
    if (userId) params.append('userId', userId);
    
    const response = await axiosInstance.get(`/quiz-attempts?${params.toString()}`);
    const result: APIGetResponse<any[]> = response.data;
    
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching quiz attempts:', error);
    return [];
  }
}
