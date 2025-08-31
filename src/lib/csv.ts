import { parse, unparse } from 'papaparse';
import type { Question } from '@/lib/validations/question';
import type { Database } from '@/lib/database.types';

type QuestionRow = Database['public']['Tables']['questions']['Row'];

export interface CSVQuestion {
  content: string;
  type: 'multiple_choice' | 'true_false' | 'free_text' | 'matching' | 'matching_pairs';
  time_limit?: number;
  hint?: string;
  is_public: boolean;
  image_url?: string;
  correct_feedback?: string;
  incorrect_feedback?: string;
  // Multiple choice / True-false specific
  answer_1?: string;
  answer_1_correct?: boolean;
  answer_2?: string;
  answer_2_correct?: boolean;
  answer_3?: string;
  answer_3_correct?: boolean;
  answer_4?: string;
  answer_4_correct?: boolean;
  answer_5?: string;
  answer_5_correct?: boolean;
  answer_6?: string;
  answer_6_correct?: boolean;
  answer_7?: string;
  answer_7_correct?: boolean;
  answer_8?: string;
  answer_8_correct?: boolean;
  // Free text specific
  accepted_answers?: string;
  grading_criteria?: string;
  // Matching specific
  match_pairs?: string; // Format: "left1|right1;left2|right2;..."
}

export function parseCSV(csvContent: string): { questions: any[]; errors: string[] } {
  const errors: string[] = [];
  const questions: any[] = [];

  try {
    const result = parse<CSVQuestion>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      transform: (value, field) => {
        // Handle empty values
        if (value === '' || value === undefined || value === null) {
          return undefined;
        }
        return value;
      },
    });

    if (result.errors.length > 0) {
      errors.push(...result.errors.map(err => `CSV Parse Error: ${err.message}`));
    }

    result.data.forEach((row, index) => {
      try {
        const question = parseQuestionRow(row, index + 2); // +2 for header and 1-indexed
        questions.push(question);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { questions, errors };
}

function parseQuestionRow(row: CSVQuestion, rowNumber: number): any {
  // Validate required fields
  if (!row.content?.trim()) {
    throw new Error('Content is required');
  }
  if (!row.type || !['multiple_choice', 'true_false', 'free_text', 'matching', 'matching_pairs'].includes(row.type)) {
    throw new Error('Invalid question type');
  }

  const baseQuestion: any = {
    content: row.content.trim(),
    type: row.type === 'matching_pairs' ? 'matching' : row.type,
    time_limit: row.time_limit ? parseInt(row.time_limit as any, 10) || null : null,
    hint: row.hint?.trim() || null,
    correct_feedback: row.correct_feedback?.trim() || null,
    incorrect_feedback: row.incorrect_feedback?.trim() || null,
    is_public: (row as any).is_public === true || (row as any).is_public === 'true' || (row as any).is_public === 'TRUE' || (row as any).is_public === '1',
    image_url: row.image_url?.trim() || null,
  };

  // Initialize metadata for type-specific data
  const metadata: any = {};

  // Type-specific parsing
  if (row.type === 'multiple_choice' || row.type === 'true_false') {
    const answers = [];
    
    // Parse up to 8 answers
    for (let i = 1; i <= 8; i++) {
      const content = row[`answer_${i}` as keyof CSVQuestion] as string;
      if (content?.trim()) {
        const isCorrectValue = row[`answer_${i}_correct` as keyof CSVQuestion];
        const isCorrect = isCorrectValue === true || isCorrectValue === 'true' || isCorrectValue === 'TRUE' || isCorrectValue === '1';
        
        answers.push({
          content: content.trim(),
          is_correct: isCorrect,
          order_index: i - 1,
        });
      }
    }

    if (answers.length < 2) {
      throw new Error('At least 2 answers are required for multiple choice/true-false questions');
    }

    if (row.type === 'true_false' && answers.length !== 2) {
      throw new Error('True/false questions must have exactly 2 answers');
    }

    if (!answers.some(a => a.is_correct)) {
      throw new Error('At least one answer must be marked as correct');
    }

    return { ...baseQuestion, answers } as Question;
  }

  if (row.type === 'free_text') {
    if (!row.accepted_answers?.trim()) {
      throw new Error('Accepted answers are required for free text questions');
    }

    const acceptedAnswers = row.accepted_answers.split('|').map(answer => ({
      content: answer.trim(),
      grading_criteria: row.grading_criteria?.trim() || null,
    })).filter(a => a.content);

    if (acceptedAnswers.length === 0) {
      throw new Error('At least one accepted answer is required');
    }

    return { ...baseQuestion, acceptedAnswers } as Question;
  }

  if (row.type === 'matching') {
    if (!row.match_pairs?.trim()) {
      throw new Error('Match pairs are required for matching questions');
    }

    const pairs = row.match_pairs.split(';').map((pair, index) => {
      const [left, right] = pair.split('|').map(s => s.trim());
      if (!left || !right) {
        throw new Error(`Invalid match pair format at position ${index + 1}`);
      }
      return {
        id: `pair_${index + 1}`,
        left,
        right,
      };
    });

    if (pairs.length < 2) {
      throw new Error('At least 2 matching pairs are required');
    }

    if (pairs.length > 8) {
      throw new Error('Maximum 8 matching pairs allowed');
    }

    baseQuestion.metadata = { matching_pairs: pairs };
    return baseQuestion as Question;
  }

  throw new Error('Invalid question type');
}

export function generateCSV(questions: QuestionRow[], answers: Record<string, any[]>): string {
  const csvData: CSVQuestion[] = questions.map(question => {
    const baseRow: CSVQuestion = {
      content: question.content,
      type: question.type as any,
      time_limit: question.time_limit || undefined,
      hint: question.hint || '',
      is_public: question.is_public,
      image_url: question.image_url || '',
    };

    // Add feedback from question fields
    baseRow.correct_feedback = question.correct_feedback || '';
    baseRow.incorrect_feedback = question.incorrect_feedback || '';

    const questionAnswers = answers[question.id] || [];

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      questionAnswers.forEach((answer, index) => {
        if (index < 8) {
          const answerNum = index + 1;
          (baseRow as any)[`answer_${answerNum}`] = answer.content;
          (baseRow as any)[`answer_${answerNum}_correct`] = answer.is_correct;
        }
      });
    } else if (question.type === 'free_text') {
      baseRow.accepted_answers = questionAnswers
        .map(a => a.content)
        .join(' | ');
      baseRow.grading_criteria = questionAnswers[0]?.grading_criteria || '';
    } else if (question.type === 'matching' && question.metadata) {
      const metadata = question.metadata as any;
      if (metadata.matching_pairs) {
        baseRow.match_pairs = metadata.matching_pairs
          .map((pair: any) => `${pair.left}|${pair.right}`)
          .join(';');
      }
    }

    return baseRow;
  });

  return unparse(csvData, {
    header: true,
    delimiter: ',',
  });
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getCSVTemplate(): string {
  const templates: CSVQuestion[] = [
    // Multiple Choice Example
    {
      content: 'What is the capital of France?',
      type: 'multiple_choice',
      time_limit: 60,
      hint: 'It\'s known as the City of Light',
      is_public: true,
      image_url: '',
      correct_feedback: 'Great job! You know your European capitals. Paris is the capital and largest city of France.',
      incorrect_feedback: 'Not quite. Review European geography. The correct answer is Paris.',
      answer_1: 'London',
      answer_1_correct: false,
      answer_2: 'Paris',
      answer_2_correct: true,
      answer_3: 'Berlin',
      answer_3_correct: false,
      answer_4: 'Madrid',
      answer_4_correct: false,
    },
    // True/False Example
    {
      content: 'The Earth is flat.',
      type: 'true_false',
      time_limit: 30,
      hint: 'Think about what astronauts see from space',
      is_public: true,
      image_url: '',
      correct_feedback: 'Correct! The Earth is indeed spherical, as proven by numerous scientific observations.',
      incorrect_feedback: 'Remember, the Earth is a sphere, not flat. This has been proven through various scientific methods.',
      answer_1: 'True',
      answer_1_correct: false,
      answer_2: 'False',
      answer_2_correct: true,
    },
    // Free Text Example
    {
      content: 'What is the chemical symbol for water?',
      type: 'free_text',
      time_limit: 30,
      hint: 'It contains hydrogen and oxygen',
      is_public: true,
      image_url: '',
      correct_feedback: 'Correct! You know your chemistry. Water is composed of two hydrogen atoms and one oxygen atom.',
      incorrect_feedback: 'Try again. Think about the elements in water. The correct answer is H2O.',
      accepted_answers: 'H2O | H₂O | water',
      grading_criteria: 'Accept H2O with or without subscript formatting',
    },
    // Matching Example
    {
      content: 'Match the country with its capital city.',
      type: 'matching',
      time_limit: 120,
      hint: 'Think about major world capitals',
      is_public: true,
      image_url: '',
      correct_feedback: 'Well done! You matched all the capitals correctly. These are some of the most well-known capital cities in the world.',
      incorrect_feedback: 'Review world geography and try again. Take your time to think about each country.',
      match_pairs: 'Japan|Tokyo;Italy|Rome;Brazil|Brasília;Canada|Ottawa',
    },
  ];

  return unparse(templates, { 
    header: true,
    columns: [
      'content', 'type', 'time_limit', 'hint', 'is_public', 'image_url', 
      'correct_feedback', 'incorrect_feedback',
      'answer_1', 'answer_1_correct',
      'answer_2', 'answer_2_correct',
      'answer_3', 'answer_3_correct',
      'answer_4', 'answer_4_correct',
      'answer_5', 'answer_5_correct',
      'answer_6', 'answer_6_correct',
      'answer_7', 'answer_7_correct',
      'answer_8', 'answer_8_correct',
      'accepted_answers', 'grading_criteria', 'match_pairs'
    ]
  });
}