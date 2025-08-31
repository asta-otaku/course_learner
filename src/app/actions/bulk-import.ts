'use server';

import { createQuestion } from './questions';
import { addQuestionToQuiz } from './quizzes';
import { axiosInstance } from '@/lib/services/axiosInstance';
import { requireRole } from '@/lib/auth';
import { parseCSV } from '@/lib/csv';
import type { APIGetResponse } from '@/lib/types';

export interface BulkImportOptions {
  csvContent: string;
  addToQuizId?: string;
  folderId?: string | null;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  total: number;
  errors: {
    row: number;
    error: string;
  }[];
  importedQuestionIds: string[];
}

export async function bulkImportQuestions(options: BulkImportOptions): Promise<BulkImportResult> {
  try {
    // Require admin role for bulk import
    await requireRole(['admin']);
    
    const { questions, errors } = parseCSV(options.csvContent);
    
    if (errors.length > 0) {
      return {
        success: 0,
        failed: errors.length,
        total: errors.length,
        errors: errors.map((error, index) => ({
          row: index + 2,
          error,
        })),
        importedQuestionIds: [],
      };
    }

    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      total: questions.length,
      errors: [],
      importedQuestionIds: [],
    };

    // Import questions one by one
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const rowNumber = i + 2; // Account for header row and 1-based indexing

      try {
        // Add folder_id to question if specified
        const questionWithFolder = options.folderId 
          ? { ...question, folder_id: options.folderId }
          : question;
        
        // Create the question
        const createResult = await createQuestion(questionWithFolder);
        
        if (createResult.success && createResult.data) {
          result.success++;
          result.importedQuestionIds.push(createResult.data.id);
          
          // Add to quiz if specified
          if (options.addToQuizId) {
            const addResult = await addQuestionToQuiz(options.addToQuizId, createResult.data.id);
            if (!addResult.success) {
              // Log error but don't fail the import
              console.error(`Failed to add question ${createResult.data.id} to quiz: ${addResult.error}`);
            }
          }
        } else {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: 'success' in createResult && !createResult.success && 'error' in createResult ? createResult.error : 'Unknown error',
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in bulkImportQuestions:', error);
    throw error;
  }
}

export async function validateCSV(csvContent: string) {
  try {
    const { questions, errors } = parseCSV(csvContent);
    
    return {
      valid: errors.length === 0,
      questionCount: questions.length,
      errors,
      questions: questions.map((q, index) => ({
        row: index + 2,
        content: q.content.substring(0, 50) + '...', // Show first 50 chars
        type: q.type,
      })),
    };
  } catch (error) {
    return {
      valid: false,
      questionCount: 0,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV'],
      questions: [],
    };
  }
}

// Template functions for bulk import
export async function getCSVTemplate(): Promise<string> {
  try {
    const response = await axiosInstance.get('/bulk-import/template/csv');
    const result: APIGetResponse<any> = response.data;
    
    // Ensure we return a string - if the API returns an object, convert it
    if (typeof result.data === 'string') {
      return result.data;
    } else {
      // If it's an object, try to extract CSV content or fall back to default
      console.warn('CSV template API returned object instead of string:', result.data);
      throw new Error('CSV template format error');
    }
  } catch (error) {
    // Fallback template if API is not available
    return `content,type,answers,correct_feedback,incorrect_feedback,hint,time_limit,is_public
"What is 2 + 2?",multiple_choice,"A) 3|B) 4|C) 5|D) 6","Correct! 2 + 2 equals 4.","Try again. Think about basic addition.",Think about counting on your fingers.,60,true
"The Earth is flat.",true_false,"True|False","That's correct! The Earth is actually round.","Incorrect. The Earth is round, not flat.",Think about what you learned in science class.,30,true
"What is the capital of France?",free_text,"Paris","Excellent! Paris is indeed the capital of France.","Close, but not quite right.",Think about famous European cities.,90,false`;
  }
}

export async function getJSONTemplate(): Promise<string> {
  try {
    const response = await axiosInstance.get('/bulk-import/template/json');
    const result: APIGetResponse<any> = response.data;
    
    // Ensure we return a string - if the API returns an object, stringify it
    if (typeof result.data === 'string') {
      return result.data;
    } else {
      // If it's an object, stringify it with proper formatting
      return JSON.stringify(result.data, null, 2);
    }
  } catch (error) {
    // Fallback template if API is not available
    const template = {
      questions: [
        {
          content: "What is 2 + 2?",
          type: "multiple_choice",
          answers: [
            { content: "3", is_correct: false, order_index: 0 },
            { content: "4", is_correct: true, order_index: 1 },
            { content: "5", is_correct: false, order_index: 2 },
            { content: "6", is_correct: false, order_index: 3 }
          ],
          correct_feedback: "Correct! 2 + 2 equals 4.",
          incorrect_feedback: "Try again. Think about basic addition.",
          hint: "Think about counting on your fingers.",
          time_limit: 60,
          is_public: true
        },
        {
          content: "The Earth is flat.",
          type: "true_false",
          answers: [
            { content: "True", is_correct: false, order_index: 0 },
            { content: "False", is_correct: true, order_index: 1 }
          ],
          correct_feedback: "That's correct! The Earth is actually round.",
          incorrect_feedback: "Incorrect. The Earth is round, not flat.",
          hint: "Think about what you learned in science class.",
          time_limit: 30,
          is_public: true
        },
        {
          content: "What is the capital of France?",
          type: "free_text",
          answers: [
            { content: "Paris", is_correct: true, order_index: 0 }
          ],
          correct_feedback: "Excellent! Paris is indeed the capital of France.",
          incorrect_feedback: "Close, but not quite right.",
          hint: "Think about famous European cities.",
          time_limit: 90,
          is_public: false
        }
      ]
    };
    return JSON.stringify(template, null, 2);
  }
}

// Transform JSON template format to expected question schema
function transformQuestionFromTemplate(question: any): any {
  console.log('Original question:', question);
  
  const transformed: any = {
    content: question.content,
    type: question.type === 'matching_pairs' ? 'matching' : question.type, // Fix type mapping
    time_limit: question.time_limit || null,
    hint: question.hint || null,
    correct_feedback: question.correct_feedback || null,
    incorrect_feedback: question.incorrect_feedback || null,
    is_public: question.is_public || false,
    image_url: question.image_url || null,
    folder_id: question.folder_id || null,
    category_id: question.category_id || null,
    grade_id: question.grade_id || null,
    metadata: null, // Initialize metadata
  };

  // Transform answers based on question type
  switch (question.type) {
    case 'multiple_choice':
      transformed.answers = [];
      // Handle answer1, answer2, answer3, answer4 format
      for (let i = 1; i <= 10; i++) {
        const answerKey = `answer${i}`;
        const correctKey = `answer${i}_correct`;
        
        if (question[answerKey]) {
          transformed.answers.push({
            content: question[answerKey],
            is_correct: question[correctKey] || false,
            order_index: i - 1,
          });
        }
      }
      break;

    case 'true_false':
      transformed.answers = [];
      // Handle answer1, answer2 format for true/false
      for (let i = 1; i <= 2; i++) {
        const answerKey = `answer${i}`;
        const correctKey = `answer${i}_correct`;
        
        if (question[answerKey]) {
          transformed.answers.push({
            content: question[answerKey],
            is_correct: question[correctKey] || false,
            order_index: i - 1,
          });
        }
      }
      break;

    case 'free_text':
      transformed.acceptedAnswers = question.accepted_answers || [];
      transformed.grading_criteria = question.grading_criteria || null;
      // Ensure image_url is explicitly set for free_text
      transformed.image_url = question.image_url || null;
      break;

    case 'matching_pairs':
      // Transform matching_pairs from complex object to array format
      if (question.matching_pairs && Array.isArray(question.matching_pairs)) {
        transformed.matching_pairs = question.matching_pairs.map((pair: any, index: number) => ({
          id: `pair_${index}`,
          left: pair.left || '',
          right: pair.right || '',
        }));
      }
      break;
  }

  // Add metadata for matching questions
  if (question.type === 'matching_pairs') {
    transformed.metadata = {
      matching_pairs: transformed.matching_pairs || []
    };
  }

  // Ensure all required fields are explicitly set to avoid undefined
  if (transformed.hint === undefined) transformed.hint = null;
  if (transformed.correct_feedback === undefined) transformed.correct_feedback = null;
  if (transformed.incorrect_feedback === undefined) transformed.incorrect_feedback = null;
  if (transformed.image_url === undefined) transformed.image_url = null;

  console.log('Transformed question:', transformed);
  return transformed;
}

// Enhanced bulk import with JSON support
export interface JSONBulkImportOptions {
  jsonContent: string;
  addToQuizId?: string;
  folderId?: string | null;
}

export async function bulkImportQuestionsFromJSON(options: JSONBulkImportOptions): Promise<BulkImportResult> {
  try {
    // Require admin role for bulk import
    await requireRole(['admin']);
    
    let parsedData: any;
    
    try {
      parsedData = JSON.parse(options.jsonContent);
    } catch (error) {
      return {
        success: 0,
        failed: 1,
        total: 1,
        errors: [{ row: 1, error: 'Invalid JSON format' }],
        importedQuestionIds: [],
      };
    }

    // Handle both formats:
    // 1. Direct array of questions: [{question1}, {question2}]
    // 2. Nested structure: {questions: [{question1}, {question2}]}
    let questions: any[];
    if (Array.isArray(parsedData)) {
      // Direct array format
      questions = parsedData;
    } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
      // Nested structure format
      questions = parsedData.questions;
    } else {
      return {
        success: 0,
        failed: 1,
        total: 1,
        errors: [{ row: 1, error: 'JSON must contain an array of questions or {questions: [...]} structure' }],
        importedQuestionIds: [],
      };
    }

    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      total: questions.length,
      errors: [],
      importedQuestionIds: [],
    };

    // Import questions one by one
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionNumber = i + 1;

      try {
        // Transform the question from template format to expected schema
        const transformedQuestion = transformQuestionFromTemplate(question);
        
        // Add folder_id to question if specified
        const questionWithFolder = options.folderId 
          ? { ...transformedQuestion, folder_id: options.folderId }
          : transformedQuestion;
        
        // Create the question
        const createResult = await createQuestion(questionWithFolder);
        
        if (createResult.success && createResult.data) {
          result.success++;
          result.importedQuestionIds.push(createResult.data.id);
          
          // Add to quiz if specified
          if (options.addToQuizId) {
            const addResult = await addQuestionToQuiz(options.addToQuizId, createResult.data.id);
            if (!addResult.success) {
              // Log error but don't fail the import
              console.error(`Failed to add question ${createResult.data.id} to quiz: ${addResult.error}`);
            }
          }
        } else {
          result.failed++;
          console.error(`Question ${questionNumber} failed:`, createResult);
          result.errors.push({
            row: questionNumber,
            error: 'error' in createResult ? createResult.error : 'Unknown error',
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: questionNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in bulkImportQuestionsFromJSON:', error);
    throw error;
  }
}

export async function validateJSON(jsonContent: string) {
  try {
    let parsedData: any;
    
    try {
      parsedData = JSON.parse(jsonContent);
    } catch (error) {
      return {
        valid: false,
        questionCount: 0,
        errors: ['Invalid JSON format'],
        questions: [],
      };
    }

    // Handle both formats:
    // 1. Direct array of questions: [{question1}, {question2}]
    // 2. Nested structure: {questions: [{question1}, {question2}]}
    let questions: any[];
    if (Array.isArray(parsedData)) {
      // Direct array format
      questions = parsedData;
    } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
      // Nested structure format
      questions = parsedData.questions;
    } else {
      return {
        valid: false,
        questionCount: 0,
        errors: ['JSON must contain an array of questions or {questions: [...]} structure'],
        questions: [],
      };
    }

    const errors: string[] = [];

    // Validate each question
    questions.forEach((q: any, index: number) => {
      if (!q.content) {
        errors.push(`Question ${index + 1}: Missing content`);
      }
      if (!q.type) {
        errors.push(`Question ${index + 1}: Missing type`);
      }
      if (!q.answers || !Array.isArray(q.answers)) {
        errors.push(`Question ${index + 1}: Missing or invalid answers array`);
      }
    });
    
    return {
      valid: errors.length === 0,
      questionCount: questions.length,
      errors,
      questions: questions.map((q: any, index: number) => ({
        row: index + 1,
        content: q.content ? q.content.substring(0, 50) + '...' : 'No content',
        type: q.type || 'Unknown',
      })),
    };
  } catch (error) {
    return {
      valid: false,
      questionCount: 0,
      errors: [error instanceof Error ? error.message : 'Failed to parse JSON'],
      questions: [],
    };
  }
}