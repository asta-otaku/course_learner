'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import { deleteCurriculum, toggleCurriculumVisibility } from '@/app/actions/curricula'
import {
  Trash,
  MoreVertical,
  Eye,
  EyeOff,
} from 'lucide-react'

interface CurriculumActionsProps {
  curriculumId: string
  canEdit: boolean
  isPublic?: boolean
}

export function CurriculumActions({ curriculumId, canEdit, isPublic = false }: CurriculumActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCurriculum(curriculumId)
      if (result.success) {
        toast({
          title: 'Curriculum deleted',
          description: 'The curriculum has been deleted successfully',
        })
        router.push('/curricula')
      } else {
        toast({
          title: 'Failed to delete curriculum',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to delete curriculum',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleVisibility = async () => {
    setIsTogglingVisibility(true)
    try {
      const result = await toggleCurriculumVisibility(curriculumId)
      if (result.success && result.data) {
        toast({
          title: 'Visibility updated',
          description: `Curriculum is now ${result.data.is_public ? 'public' : 'private'}`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Failed to update visibility',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to update visibility',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  if (!canEdit) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleToggleVisibility}
            disabled={isTogglingVisibility}
          >
            {isPublic ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Make Public
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the curriculum
              and all associated sections and lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}