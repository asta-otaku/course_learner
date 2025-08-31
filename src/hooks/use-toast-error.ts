"use client"

import { useToast } from "@/hooks/use-toast"
import { useCallback } from "react"

export function useToastError() {
  const { toast } = useToast()

  const showError = useCallback(
    (error: unknown, title = "Error") => {
      const message = error instanceof Error 
        ? error.message 
        : typeof error === "string" 
        ? error 
        : "An unexpected error occurred"

      toast({
        title,
        description: message,
        variant: "destructive",
      })
    },
    [toast]
  )

  const showSuccess = useCallback(
    (message: string, title = "Success") => {
      toast({
        title,
        description: message,
      })
    },
    [toast]
  )

  return { showError, showSuccess }
}