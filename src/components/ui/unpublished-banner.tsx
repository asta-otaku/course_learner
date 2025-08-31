import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface UnpublishedBannerProps {
  status: 'draft' | 'archived' | 'unpublished'
  type: 'quiz' | 'lesson' | 'content'
  className?: string
}

export function UnpublishedBanner({ status, type, className }: UnpublishedBannerProps) {
  const messages = {
    draft: {
      title: `Draft ${type}`,
      description: `This ${type} is in draft mode and is not visible to students. Publish it when you're ready.`,
      icon: EyeOff,
      variant: 'warning' as const,
    },
    archived: {
      title: `Archived ${type}`,
      description: `This ${type} has been archived and is no longer visible to students.`,
      icon: EyeOff,
      variant: 'destructive' as const,
    },
    unpublished: {
      title: `Unpublished ${type}`,
      description: `This ${type} is not published and is only visible to instructors.`,
      icon: EyeOff,
      variant: 'warning' as const,
    },
  }

  const config = messages[status] || messages.unpublished
  const Icon = config.icon

  return (
    <Alert variant={config.variant} className={cn('mb-6', className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-lg font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-1">
        {config.description}
      </AlertDescription>
    </Alert>
  )
}