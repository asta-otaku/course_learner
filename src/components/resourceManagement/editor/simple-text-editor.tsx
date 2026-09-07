'use client'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, Link2, Sigma, Code } from 'lucide-react'
import { useRef } from 'react'

interface SimpleTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SimpleTextEditor({
  value,
  onChange,
  placeholder,
  className
}: SimpleTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/10">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('**', '**')}
          type="button"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('*', '*')}
          type="button"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('\n- ')}
          type="button"
          title="List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('[', '](url)')}
          type="button"
          title="Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('$', '$')}
          type="button"
          title="Math (inline)"
        >
          <Sigma className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('\n$$\n', '\n$$\n')}
          type="button"
          title="Math (block)"
        >
          <div className="flex items-center gap-1">
            <Sigma className="h-4 w-4" />
            <span className="text-xs">²</span>
          </div>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertMarkdown('`', '`')}
          type="button"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none ${className}`}
        rows={4}
      />
    </div>
  )
}