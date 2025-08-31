import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getQuiz } from '@/app/actions/quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnpublishedBanner } from '@/components/ui/unpublished-banner'
import { ArrowLeft, Edit, Play } from 'lucide-react'
// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';


interface PreviewQuizPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PreviewQuizPage({ params }: PreviewQuizPageProps) {
  const { id } = await params
  const quiz = await getQuiz(id)

  if (!quiz) {
    notFound()
  }

  // Calculate total points
  const totalPoints = quiz.quiz_questions?.reduce((sum: number, qq: any) => {
    return sum + (qq.points_override || qq.question?.points || 1)
  }, 0) || 0

  // Parse settings if it's a JSON type
  const settings = typeof quiz.settings === 'object' && quiz.settings !== null
    ? quiz.settings as any
    : {}

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Unpublished Banner */}
      {quiz.status !== 'published' && (
        <UnpublishedBanner status={quiz.status as 'draft' | 'archived'} type="quiz" />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/quizzes/${quiz.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Preview Mode</h1>
          <p className="text-sm text-muted-foreground">
            This is how students will see your quiz
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/quizzes/${quiz.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/take-quiz/${quiz.id}`}>
            <Play className="h-4 w-4 mr-2" />
            Take Quiz
          </Link>
        </Button>
      </div>

      {/* Quiz Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Questions</p>
              <p className="font-medium">{quiz.quiz_questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Points</p>
              <p className="font-medium">{totalPoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time Limit</p>
              <p className="font-medium">
                {settings.timeLimit ? `${settings.timeLimit} minutes` : 'None'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Passing Score</p>
              <p className="font-medium">{settings.passingScore || 70}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview */}
      <div className="space-y-4">
        {quiz.quiz_questions && quiz.quiz_questions.length > 0 ? (
          quiz.quiz_questions.map((qq: any, index: number) => (
            <Card key={qq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <Badge variant="secondary">{qq.question.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{qq.question.title}</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {qq.question.content}
                  </p>
                  {qq.question.image_url && (
                    <div className="mt-4">
                      <img 
                        src={qq.question.image_url} 
                        alt="Question illustration" 
                        className="max-w-full h-auto rounded-lg border shadow-sm"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>

                {/* Multiple Choice Questions */}
                {qq.question.type === 'multiple_choice' && qq.question.question_answers && (
                  <div className="space-y-2 pl-4">
                    {qq.question.question_answers
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((answer: any, optIndex: number) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span>{answer.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False Questions */}
                {qq.question.type === 'true_false' && qq.question.question_answers && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    {qq.question.question_answers
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((answer: any) => (
                      <div key={answer.id} className="flex items-center justify-center p-4 border rounded-lg">
                        <span className="font-medium">{answer.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Questions */}
                {qq.question.type === 'matching' && qq.question.matching_pairs && (
                  <div className="space-y-2 pl-4">
                    <p className="text-sm text-muted-foreground mb-2">Match the items from left to right:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Items</p>
                        {qq.question.matching_pairs.map((pair: any, index: number) => (
                          <div key={`left-${pair.id}`} className="p-3 border rounded-lg bg-muted/50">
                            <span>{pair.left}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Matches</p>
                        {qq.question.matching_pairs.map((pair: any, index: number) => (
                          <div key={`right-${pair.id}`} className="p-3 border rounded-lg bg-muted/50">
                            <span>{pair.right}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Free Text Questions (Short Answer, Long Answer, Free Text) */}
                {(qq.question.type === 'free_text' || qq.question.type === 'short_answer' || qq.question.type === 'long_answer') && (
                  <div className="pl-4">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        {qq.question.type === 'long_answer' 
                          ? 'Students will provide a detailed written response'
                          : 'Students will provide a text response'}
                      </p>
                      {qq.question.type === 'long_answer' && (
                        <div className="mt-2 h-24 border rounded bg-background" />
                      )}
                      {(qq.question.type === 'short_answer' || qq.question.type === 'free_text') && (
                        <div className="mt-2 h-12 border rounded bg-background" />
                      )}
                    </div>
                  </div>
                )}

                {/* Coding Questions */}
                {qq.question.type === 'coding' && (
                  <div className="pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Language: {qq.question.language || 'Any'}
                      </Badge>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        Students will write code to solve this problem
                      </p>
                      {qq.question.starterCode && (
                        <pre className="text-sm bg-background p-3 rounded border font-mono">
                          {qq.question.starterCode}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Ordering Questions */}
                {qq.question.type === 'ordering' && qq.question.ordering_items && (
                  <div className="pl-4 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">Arrange in the correct order:</p>
                    {qq.question.ordering_items
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((item: any, index: number) => (
                      <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span>{item.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {qq.explanation && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm italic">{qq.explanation}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {qq.points_override || qq.question?.points || 1} point{(qq.points_override || qq.question?.points || 1) !== 1 ? 's' : ''}
                  </Badge>
                  {qq.question.difficulty_level && (
                    <Badge variant="outline" className="text-xs">
                      Difficulty: {qq.question.difficulty_level}
                    </Badge>
                  )}
                  {qq.question.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No questions in this quiz yet.</p>
              <Button className="mt-4" asChild>
                <Link href={`/quizzes/${quiz.id}/edit`}>
                  Add Questions
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
