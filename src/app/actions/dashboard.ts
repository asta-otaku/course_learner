'use server';

import { axiosInstance } from '@/lib/services/axiosInstance';
import type { APIGetResponse } from '@/lib/types';

export async function getStudentDashboardData() {
  try {
    const response = await axiosInstance.get('/dashboard/student');
    const result: APIGetResponse<any> = response.data;
    
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    console.error('Error in getStudentDashboardData:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
    return { 
      success: false, 
      error: errorMessage,
      data: null 
    };
  }
}

export async function getTeacherDashboardData() {
  try {
    const response = await axiosInstance.get('/dashboard/teacher');
    const result: APIGetResponse<any> = response.data;
    
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    console.error('Error in getTeacherDashboardData:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
    return { 
      success: false, 
      error: errorMessage,
      data: null 
    };
  }
}

export async function getAdminDashboardData() {
  try {
    const response = await axiosInstance.get('/dashboard/admin');
    const result: APIGetResponse<any> = response.data;
    
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    console.error('Error in getAdminDashboardData:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
    return { 
      success: false, 
      error: errorMessage,
      data: null 
    };
  }
}