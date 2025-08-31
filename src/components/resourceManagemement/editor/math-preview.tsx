'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathPreviewProps {
  content: string;
  className?: string;
  renderMarkdown?: boolean;
  katexOptions?: katex.KatexOptions;
}

export function MathPreview({
  content,
  className = '',
  renderMarkdown = false,
  katexOptions = {},
}: MathPreviewProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Function to render LaTeX
    const renderLatexToHtml = (math: string, displayMode: boolean) => {
      try {
        return katex.renderToString(math, {
          throwOnError: false,
          displayMode,
          ...katexOptions,
        });
      } catch (error) {
        return `<span data-testid="math-error" class="text-red-500">LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
      }
    };

    // First handle escaped dollar signs by temporarily replacing them
    let processedContent = content.replace(/\\\$/g, '\u0000ESCAPED_DOLLAR\u0000');
    
    // If renderMarkdown is true, process markdown first (before math)
    if (renderMarkdown) {
      // Process headings
      processedContent = processedContent.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      processedContent = processedContent.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      
      // Process bold (but not within math expressions)
      processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
      
      // Process italic (but not within math expressions)
      processedContent = processedContent.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    }
    
    // Parse content for LaTeX expressions
    // Use a more complex approach to handle consecutive delimiters correctly
    let htmlContent = '';
    let remaining = processedContent;
    
    while (remaining.length > 0) {
      // Try to match block math first
      const blockMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
      if (blockMatch && blockMatch[1] !== undefined) {
        const mathContent = blockMatch[1].replace(/\u0000ESCAPED_DOLLAR\u0000/g, '\\$');
        const rendered = renderLatexToHtml(mathContent, true);
        htmlContent += `<div class="my-4" data-testid="math-block">${rendered}</div>`;
        remaining = remaining.slice(blockMatch[0].length);
        continue;
      }
      
      // Try to match inline math
      const inlineMatch = remaining.match(/^\$([^$]+?)\$/);
      if (inlineMatch && inlineMatch[1] !== undefined) {
        // Check if this is actually part of a block math ($$)
        if (remaining.length > inlineMatch[0].length && remaining[inlineMatch[0].length] === '$') {
          // This is the start of $$, not inline math
          htmlContent += remaining[0];
          remaining = remaining.slice(1);
          continue;
        }
        
        const mathContent = inlineMatch[1].replace(/\u0000ESCAPED_DOLLAR\u0000/g, '\\$');
        const rendered = renderLatexToHtml(mathContent, false);
        htmlContent += `<span data-testid="math-inline">${rendered}</span>`;
        remaining = remaining.slice(inlineMatch[0].length);
        continue;
      }
      
      // No math found, take one character
      htmlContent += remaining[0];
      remaining = remaining.slice(1);
    }
    
    // Restore escaped dollar signs (keep the backslash for display)
    htmlContent = htmlContent.replace(/\u0000ESCAPED_DOLLAR\u0000/g, '\\$');
    
    // If renderMarkdown, wrap paragraphs
    if (renderMarkdown) {
      const lines = htmlContent.split('\n\n');
      htmlContent = lines.map(line => {
        line = line.trim();
        if (!line) return '';
        // Don't wrap if already wrapped in HTML tags
        if (line.startsWith('<h') || line.startsWith('<div')) {
          return line;
        }
        return `<p>${line}</p>`;
      }).join('');
    }
    
    return htmlContent;
  }, [content, katexOptions, renderMarkdown]);

  if (!renderedContent) {
    return <div data-testid="math-preview-container" className={className} />;
  }

  const containerClass = renderMarkdown 
    ? `prose prose-sm max-w-none ${className}`
    : className;

  return (
    <div 
      data-testid="math-preview-container" 
      className={containerClass}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}