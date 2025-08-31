import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Play } from 'lucide-react'
import Link from 'next/link'

interface AvailableQuiz {
  id: string
  title: string
  description?: string
  questionCount: number
  allowRetake: boolean
}

interface AvailableQuizzesProps {
  quizzes: AvailableQuiz[]
}

export function AvailableQuizzes({ quizzes }: AvailableQuizzesProps) {
  if (quizzes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Available Quizzes</CardTitle>
          <CardDescription>Quizzes you can take</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No quizzes available at the moment</p>
            <p className="text-sm mt-2">Check back later for new quizzes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins">Available Quizzes</CardTitle>
            <CardDescription>Ready to test your knowledge?</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/take-quiz">Browse All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{quiz.title}</h4>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {quiz.questionCount} questions
                    </span>
                    {quiz.allowRetake && (
                      <Badge variant="outline" className="text-xs">
                        Retakeable
                      </Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/take-quiz/${quiz.id}`}>
                    <Play className="h-3 w-3 mr-1" />
                    Start
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