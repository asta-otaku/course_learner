'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  preview?: 'edit' | 'live' | 'preview';
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text here... (Markdown and LaTeX supported)',
  height = 200,
  preview = 'live',
}: RichTextEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleImageUpload = (url: string) => {
    // Insert image markdown at cursor position
    const imageMarkdown = `![Image](${url})`;
    onChange(value + '\n\n' + imageMarkdown);
    setShowImageDialog(false);
  };

  // Custom toolbar commands
  const customCommands = [
    {
      name: 'image-upload',
      keyCommand: 'image-upload',
      buttonProps: { 'aria-label': 'Upload image' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 20 20">
          <path
            fill="currentColor"
            d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
          />
        </svg>
      ),
      execute: () => {
        setShowImageDialog(true);
      },
    },
  ];

  return (
    <>
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={height}
          preview={preview}
          textareaProps={{
            placeholder,
          }}
          commands={[
            ...customCommands,
          ]}
        />
      </div>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Upload an image to insert into your content
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ImageUpload
              onChange={handleImageUpload}
              bucket="content-images"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}