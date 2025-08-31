'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import type { ApiResponse, APIGetResponse } from '@/lib/types';
import { 
  collectionSchema, 
  collectionUpdateSchema,
  type CollectionInput,
  type CollectionUpdateInput 
} from '@/lib/validations/collection';

export async function getCollections() {
  try {
    const response = await axiosInstance.get('/collections');
    const result: APIGetResponse<any[]> = response.data;
    
    return { collections: result.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch collections';
    return { collections: null, error: errorMessage };
  }
}

export async function getCollection(id: string) {
  try {
    const response = await axiosInstance.get(`/collections/${id}`);
    const result: APIGetResponse<any> = response.data;
    
    return { collection: result.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch collection';
    return { collection: null, error: errorMessage };
  }
}

export async function createCollection(input: CollectionInput) {
  try {
    // Validate input
    const validation = collectionSchema.safeParse(input);
    if (!validation.success) {
      return { 
        collection: null, 
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const response = await axiosInstance.post('/collections', {
      name: validation.data.name,
      description: validation.data.description || null,
    });
    
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/collections');
      return { collection: result.data.data, error: null };
    }
    
    return { collection: null, error: 'Failed to create collection' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create collection';
    return { collection: null, error: errorMessage };
  }
}

export async function updateCollection(id: string, input: CollectionUpdateInput) {
  try {
    // Validate input
    const validation = collectionUpdateSchema.safeParse(input);
    if (!validation.success) {
      return { 
        collection: null, 
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const updateData: any = {};
    if (validation.data.name !== undefined) updateData.name = validation.data.name;
    if (validation.data.description !== undefined) updateData.description = validation.data.description ?? null;

    const response = await axiosInstance.put(`/collections/${id}`, updateData);
    const result: ApiResponse<any> = response.data;
    
    if (result.data) {
      revalidatePath('/collections');
      revalidatePath(`/collections/${id}`);
      return { collection: result.data.data, error: null };
    }
    
    return { collection: null, error: 'Failed to update collection' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update collection';
    return { collection: null, error: errorMessage };
  }
}

export async function deleteCollection(id: string) {
  try {
    await axiosInstance.delete(`/collections/${id}`);
    
    revalidatePath('/collections');
    return { error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete collection';
    return { error: errorMessage };
  }
}

export async function addQuestionToCollection(collectionId: string, questionId: string) {
  try {
    await axiosInstance.post(`/collections/${collectionId}/questions`, {
      questionId
    });
    
    revalidatePath(`/collections/${collectionId}`);
    return { success: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add question to collection';
    return { success: false, error: errorMessage };
  }
}

export async function removeQuestionFromCollection(collectionId: string, questionId: string) {
  try {
    await axiosInstance.delete(`/collections/${collectionId}/questions/${questionId}`);
    
    revalidatePath(`/collections/${collectionId}`);
    return { success: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to remove question from collection';
    return { success: false, error: errorMessage };
  }
}

export async function reorderCollectionQuestions(
  collectionId: string, 
  questionOrders: Array<{ questionId: string; orderIndex: number }>
) {
  try {
    await axiosInstance.patch(`/collections/${collectionId}/reorder`, {
      questionOrders
    });
    
    revalidatePath(`/collections/${collectionId}`);
    return { success: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to reorder questions';
    return { success: false, error: errorMessage };
  }
}