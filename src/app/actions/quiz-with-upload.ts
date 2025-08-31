'use server';

import { revalidatePath } from 'next/cache';
import { axiosInstance } from '@/lib/services/axiosInstance';
import { createQuizSchema, type CreateQuizInput } from '@/lib/validations/quiz';
import { createQuestion } from './questions';
import { addQuestionToQuiz } from './quizzes';
import type { ApiResponse } from '@/lib/types';

interface CreateQuizWithQuestionsInput extends CreateQuizInput {
  questions?: any[];
  folderId?: string | null;
}

export async function createQuizWithQuestions(input: CreateQuizWithQuestionsInput) {
  try {
    // Validate input
    const validatedData = createQuizSchema.parse(input);
    
    // First, create the quiz
    const response = await axiosInstance.post('/quiz', {
      title: validatedData.title,
      description: validatedData.description || null,
      category_id: null, // Optional now
      grade_id: null, // Optional now
      lesson_id: validatedData.lessonId || null,
      tags: validatedData.tags || null,
      status: 'draft',
      settings: validatedData.settings || null,
    });

    const result: ApiResponse<any> = response.data;
    
    if (!result.data?.data) {
      return { success: false, error: 'Failed to create quiz' };
    }

    const quiz = result.data.data;

    // If there are questions to import, process them
    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    if (input.questions && input.questions.length > 0) {
      for (let i = 0; i < input.questions.length; i++) {
        const question = input.questions[i];
        const rowNumber = i + 1;

        try {
          // Add folder_id to question if specified
          const questionWithFolder = input.folderId 
            ? { ...question, folder_id: input.folderId }
            : question;
          
          // Create the question
          const createResult = await createQuestion(questionWithFolder);
          
          if (createResult.success && createResult.data) {
            importedCount++;
            
            // Add question to the quiz
            const addResult = await addQuestionToQuiz(quiz.id, createResult.data.id);
            if (!addResult.success) {
              console.error(`Failed to add question ${createResult.data.id} to quiz: ${addResult.error}`);
              errors.push(`Row ${rowNumber}: Failed to add question to quiz`);
            }
          } else {
            failedCount++;
            const errorMsg = 'error' in createResult ? createResult.error : 'Unknown error';
            errors.push(`Row ${rowNumber}: ${errorMsg}`);
          }
        } catch (error) {
          failedCount++;
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Log import results
      if (errors.length > 0) {
        console.log('Import errors:', errors);
      }
    }

    // Revalidate paths
    revalidatePath('/quizzes');
    if (validatedData.lessonId) {
      revalidatePath(`/lessons/${validatedData.lessonId}`);
    }

    return { 
      success: true, 
      data: quiz,
      importResults: input.questions ? {
        imported: importedCount,
        failed: failedCount,
        errors
      } : undefined
    };
  } catch (error: any) {
    console.error('Error in createQuizWithQuestions:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { success: false, error: errorMessage };
  }
}