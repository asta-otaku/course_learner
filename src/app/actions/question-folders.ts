'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { ApiResponse, APIGetResponse } from '@/lib/types';
import { z } from 'zod';

type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  metadata: z.record(z.any()).optional(),
});

const moveFolderSchema = z.object({
  folderId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
});

// Create a new folder
export async function createFolder(
  data: z.infer<typeof createFolderSchema>
): Promise<ActionResponse<any>> {
  try {
    const validation = createFolderSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const response = await axiosInstance.post('/question-folders', {
      name: validation.data.name,
      parent_id: validation.data.parentId || null,
      metadata: validation.data.metadata || {},
    });

    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to create folder' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create folder';
    return { success: false, error: errorMessage };
  }
}

// Get folder tree for the current user
export async function getFolderTree(): Promise<ActionResponse<any[]>> {
  try {
    const response = await axiosInstance.get('/question-folders');
    const result: APIGetResponse<any[]> = response.data;
    
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch folders';
    return { success: false, error: errorMessage };
  }
}

// Get a specific folder with its contents
export async function getFolderContents(
  folderId: string | null
): Promise<ActionResponse<{
  folder: any | null;
  questions: any[];
  subfolders: any[];
}>> {
  try {
    const endpoint = folderId ? `/question-folders/${folderId}/contents` : '/question-folders/root/contents';
    const response = await axiosInstance.get(endpoint);
    const result: APIGetResponse<any> = response.data;
    
    return { success: true, data: result.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch folder contents';
    return { success: false, error: errorMessage };
  }
}

// Update folder (rename or update metadata)
export async function updateFolder(
  folderId: string,
  data: z.infer<typeof updateFolderSchema>
): Promise<ActionResponse<any>> {
  try {
    const validation = updateFolderSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const updateData: any = {};
    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.metadata !== undefined) updateData.metadata = validation.data.metadata;

    const response = await axiosInstance.put(`/question-folders/${folderId}`, updateData);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to update folder' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update folder';
    return { success: false, error: errorMessage };
  }
}

// Move folder to a new parent
export async function moveFolder(
  data: z.infer<typeof moveFolderSchema>
): Promise<ActionResponse<any>> {
  try {
    const validation = moveFolderSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || 'Validation failed' };
    }

    const response = await axiosInstance.patch(`/question-folders/${validation.data.folderId}/move`, {
      new_parent_id: validation.data.newParentId,
    });

    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/questions');
      return { success: true, data: result.data.data };
    }
    
    return { success: false, error: 'Failed to move folder' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to move folder';
    return { success: false, error: errorMessage };
  }
}

// Delete folder
export async function deleteFolder(
  folderId: string,
  deleteContents: boolean = false
): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.delete(`/question-folders/${folderId}`, {
      data: { delete_contents: deleteContents }
    });

    revalidatePath('/questions');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete folder';
    return { success: false, error: errorMessage };
  }
}

// Move questions to a folder
export async function moveQuestionsToFolder(
  questionIds: string[],
  targetFolderId: string | null
): Promise<ActionResponse<void>> {
  try {
    if (questionIds.length === 0) {
      return { success: false, error: 'No questions selected' };
    }

    await axiosInstance.patch('/question-folders/move-questions', {
      question_ids: questionIds,
      target_folder_id: targetFolderId,
    });

    revalidatePath('/questions');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to move questions';
    return { success: false, error: errorMessage };
  }
}

// Get question counts for each folder (including recursive counts from subfolders)
export async function getFolderQuestionCounts(): Promise<ActionResponse<{ folderCounts: Record<string, number>; totalQuestions: number }>> {
  try {
    const response = await axiosInstance.get('/question-folders/question-counts');
    const result: APIGetResponse<any> = response.data;
    
    return { success: true, data: result.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to get question counts';
    return { success: false, error: errorMessage };
  }
}

// Get folder breadcrumb path
export async function getFolderBreadcrumb(
  folderId: string | null
): Promise<ActionResponse<Array<{ id: string; name: string }>>> {
  try {
    if (!folderId) {
      return { success: true, data: [] };
    }

    const response = await axiosInstance.get(`/question-folders/${folderId}/breadcrumb`);
    const result: APIGetResponse<any[]> = response.data;
    
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch breadcrumb';
    return { success: false, error: errorMessage };
  }
}

// Reorder folders
export async function reorderFolders(
  folderOrders: Array<{ id: string; order_index: number }>
): Promise<ActionResponse<void>> {
  try {
    await axiosInstance.patch('/question-folders/reorder', {
      folder_orders: folderOrders,
    });

    revalidatePath('/questions');
    return { success: true, data: undefined };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to reorder folders';
    return { success: false, error: errorMessage };
  }
}