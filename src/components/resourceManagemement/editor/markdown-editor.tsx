'use client';

import React, { useCallback } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { MathPreview } from './math-preview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: () => void;
  height?: number;
  placeholder?: string;
  preview?: 'edit' | 'live' | 'preview';
  extraCommands?: any[];
}

export function MarkdownEditor({
  value,
  onChange,
  onImageUpload,
  height = 300,
  placeholder = 'Enter content...',
  preview = 'live',
  extraCommands = [],
}: MarkdownEditorProps) {
  // Custom LaTeX command
  const latexCommand = {
    name: 'latex',
    keyCommand: 'latex',
    buttonProps: { 'aria-label': 'Insert LaTeX', 'data-testid': 'latex-button' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    execute: (state: any, api: any) => {
      // Check if shift key is pressed for inline math
      const isInline = window.event && (window.event as KeyboardEvent).shiftKey;
      const delimiter = isInline ? '$' : '$$';
      const placeholder = isInline ? 'inline math' : 'display math';
      
      const newState = api.replaceSelection(`${delimiter}${placeholder}${delimiter}`);
      
      // Position cursor between delimiters
      const newPosition = state.selection.start + delimiter.length;
      api.setSelectionRange({
        start: newPosition,
        end: newPosition + placeholder.length,
      });
    },
  };

  // Custom image upload command
  const imageUploadCommand = {
    name: 'image-upload',
    keyCommand: 'image-upload',
    buttonProps: { 'aria-label': 'Upload Image', 'data-testid': 'image-upload-button' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    ),
    execute: () => {
      if (onImageUpload) {
        onImageUpload();
      }
    },
  };

  const allCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.title,
    commands.link,
    commands.quote,
    commands.code,
    commands.image,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
  ];

  const allExtraCommands = [
    latexCommand,
    imageUploadCommand,
    ...extraCommands,
  ];

  const handleChange = useCallback((val?: string) => {
    onChange(val || '');
  }, [onChange]);

  return (
    <div data-testid="md-editor" style={{ height }}>
      <MDEditor
        value={value}
        onChange={handleChange}
        preview={preview}
        height={height}
        commands={allCommands}
        extraCommands={allExtraCommands}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          components: {
            code: ({ children, className, ...props }) => {
              const isInlineMath = className === 'language-math';
              const isBlockMath = className === 'language-math-display';
              
              if (isInlineMath || isBlockMath) {
                return (
                  <MathPreview
                    content={String(children)}
                    data-testid="markdown-preview"
                  />
                );
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          },
        }}
      />
    </div>
  );
}