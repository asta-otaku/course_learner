'use client'

import { useState } from 'react'
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
import { Trash, Archive, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteQuiz, updateQuizStatus } from '@/app/actions/quizzes'

interface BulkActionsToolbarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onComplete: () => void
}

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onComplete,
}: BulkActionsToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (selectedIds.length === 0) {
    return null
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      let deletedCount = 0
      let errors = 0

      for (const id of selectedIds) {
        const result = await deleteQuiz(id)
        if (result.success) {
          deletedCount++
        } else {
          errors++
        }
      }

      if (errors > 0) {
        toast.error(`Failed to delete ${errors} quiz(zes)`)
      }
      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} quiz(zes)`)
      }

      onClearSelection()
      onComplete()
    } catch (error) {
      toast.error('Failed to delete quizzes')
    } finally {
      setIsProcessing(false)
      setShowDeleteDialog(false)
    }
  }

  const handleStatusUpdate = async (status: 'published' | 'draft' | 'archived') => {
    setIsProcessing(true)
    try {
      let updatedCount = 0
      let errors = 0

      for (const id of selectedIds) {
        const result = await updateQuizStatus(id, status)
        if (result.success) {
          updatedCount++
        } else {
          errors++
        }
      }

      if (errors > 0) {
        toast.error(`Failed to update ${errors} quiz(zes)`)
      }
      if (updatedCount > 0) {
        toast.success(`Updated ${updatedCount} quiz(zes) to ${status}`)
      }

      onClearSelection()
      onComplete()
    } catch (error) {
      toast.error('Failed to update quiz status')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.length} quiz{selectedIds.length > 1 ? 'zes' : ''} selected
          </span>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('published')}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('draft')}
              disabled={isProcessing}
            >
              Draft
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('archived')}
              disabled={isProcessing}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isProcessing}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} quiz{selectedIds.length > 1 ? 'zes' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected quiz{selectedIds.length > 1 ? 'zes' : ''} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}