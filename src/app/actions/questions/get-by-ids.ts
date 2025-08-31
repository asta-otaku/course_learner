'use server';

import { axiosInstance } from '@/lib/services/axiosInstance';
import type { APIGetResponse } from '@/lib/types';

export async function getQuestionsByIds(ids: string[]) {
  try {
    if (ids.length === 0) {
      return { success: true, data: [] };
    }

    const response = await axiosInstance.get('/questions/by-ids', {
      params: { ids: ids.join(',') }
    });
    
    const result: APIGetResponse<any[]> = response.data;
    
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    console.error('Error in getQuestionsByIds:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch questions';
    return { success: false, error: errorMessage };
  }
}