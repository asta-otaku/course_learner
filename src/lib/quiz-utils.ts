/**
 * Get human-readable label for question type
 */
export function getTypeLabel(type:any): string {
  const typeLabels: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    short_answer: 'Short Answer',
    long_answer: 'Long Answer',
    fill_in_blank: 'Fill in the Blank',
    matching: 'Matching',
    matching_pairs: 'Matching Pairs',
    ordering: 'Ordering',
    code: 'Code',
    coding: 'Coding',
    free_text: 'Free Text',
  }
  
  return typeLabels[type] || type
}

/**
 * Get color class for difficulty level
 */
export function getDifficultyColor(difficulty: any): string {
  const difficultyColors: Record<any, string> = {
    easy: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hard: 'text-red-600 bg-red-50 border-red-200',
  }
  
  return difficultyColors[difficulty] || 'text-gray-600 bg-gray-50 border-gray-200'
}

/**
 * Format time limit in minutes to human-readable string
 */
export function formatTimeLimit(minutes: number | null | undefined): string {
  if (!minutes) return 'No time limit'
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
}

/**
 * Calculate total points for a quiz
 */
export function calculateTotalPoints(questions: Array<{ points?: number }>): number {
  return questions.reduce((total, question) => total + (question.points || 1), 0)
}

/**
 * Get badge variant for quiz status
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'published':
      return 'default'
    case 'draft':
      return 'secondary'
    case 'archived':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * Check if a quiz is currently available based on date constraints
 */
export function isQuizAvailable(availableFrom?: string | null, availableTo?: string | null): boolean {
  const now = new Date()
  
  if (availableFrom) {
    const fromDate = new Date(availableFrom)
    if (now < fromDate) return false
  }
  
  if (availableTo) {
    const toDate = new Date(availableTo)
    if (now > toDate) return false
  }
  
  return true
}

/**
 * Format score as percentage
 */
export function formatScore(score: number, total: number): string {
  if (total === 0) return '0%'
  const percentage = (score / total) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Get grade letter based on percentage
 */
export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate a unique quiz attempt ID
 */
export function generateAttemptId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}