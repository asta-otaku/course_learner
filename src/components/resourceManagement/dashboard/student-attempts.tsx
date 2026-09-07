import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StudentAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  submitted_at: string
  status: string
  quiz: {
    id: string
    title: string
  }
  user: {
    id: string
    full_name?: string
    email: string
  }
}

interface StudentAttemptsProps {
  attempts: StudentAttempt[]
  showViewAll?: boolean
}

export function StudentAttempts({ attempts, showViewAll = true }: StudentAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Recent Student Activity</CardTitle>
          <CardDescription>Track your students' quiz attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No student attempts yet</p>
            <p className="text-sm mt-2">Student quiz attempts will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'ST'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins">Recent Student Activity</CardTitle>
            <CardDescription>Latest quiz submissions from your students</CardDescription>
          </div>
          {showViewAll && attempts.length > 5 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/student">View All Students</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attempts.slice(0, 10).map((attempt) => (
            <div key={attempt.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(attempt.user.full_name, attempt.user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {attempt.user.full_name || attempt.user.email}
                  </span>
                  {getStatusIcon(attempt.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Link href={`/quizzes/${attempt.quiz_id}`} className="hover:underline">
                    {attempt.quiz.title}
                  </Link>
                  <span className="mx-2">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {attempt.status === 'completed' && (
                  <Badge variant={getScoreBadgeVariant(attempt.score)}>
                    {attempt.score}%
                  </Badge>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/quiz-results/${attempt.id}`}>
                    View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}