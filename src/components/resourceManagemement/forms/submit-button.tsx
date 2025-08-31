"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

interface SubmitButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  asChild?: boolean
}

export function SubmitButton({
  loading = false,
  loadingText = "Loading...",
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}