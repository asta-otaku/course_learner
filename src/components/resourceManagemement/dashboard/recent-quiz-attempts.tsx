import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface QuizAttempt {
  id: string
  quiz_id: string
  score: number
  time_spent: number
  submitted_at: string
  status: string
  quiz: {
    id: string
    title: string
  }
}

interface RecentQuizAttemptsProps {
  attempts: QuizAttempt[]
  showViewAll?: boolean
}

export function RecentQuizAttempts({ attempts, showViewAll = true }: RecentQuizAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Recent Quiz Attempts</CardTitle>
          <CardDescription>Your quiz history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No quiz attempts yet</p>
            <Button asChild className="mt-4">
              <Link href="/take-quiz">Take Your First Quiz</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const getScoreTrend = (currentScore: number, previousScore?: number) => {
    if (!previousScore) return null
    if (currentScore > previousScore) return { icon: TrendingUp, color: 'text-green-600' }
    if (currentScore < previousScore) return { icon: TrendingDown, color: 'text-red-600' }
    return { icon: Minus, color: 'text-gray-600' }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins">Recent Quiz Attempts</CardTitle>
            <CardDescription>Your latest quiz performance</CardDescription>
          </div>
          {showViewAll && attempts.length > 5 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/quiz-results">View All</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attempts.slice(0, 5).map((attempt, index) => {
            const previousAttempt = attempts[index + 1]
            const trend = previousAttempt ? getScoreTrend(attempt.score, previousAttempt.score) : null
            
            return (
              <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <Link href={`/quiz-results/${attempt.id}`} className="hover:underline">
                    <h4 className="font-medium">{attempt.quiz.title}</h4>
                  </Link>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(attempt.time_spent / 60)}m
                    </span>
                    <span>{formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {trend && <trend.icon className={`h-4 w-4 ${trend.color}`} />}
                  <Badge variant={getScoreBadgeVariant(attempt.score)}>
                    {attempt.score}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}