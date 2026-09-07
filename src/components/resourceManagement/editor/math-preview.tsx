"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathPreviewProps {
  content: string;
  className?: string;
  renderMarkdown?: boolean;
  katexOptions?: katex.KatexOptions;
}

type MathToken = {
  placeholder: string;
  html: string;
};

/**
 * Correct answers are often stored as bare TeX (e.g. `\frac{1}{2}`) without
 * `$...$` delimiters. Feedback/prose usually already includes delimiters.
 * Wrap only when the string (or ` or `-separated parts) looks like a pure
 * expression — not English sentences that happen to contain a command.
 */
function isBareLatexExpression(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\$|\\\(|\\\[/.test(trimmed)) return false;
  if (!/\\[a-zA-Z]+/.test(trimmed)) return false;

  const leftover = trimmed
    .replace(/\\[a-zA-Z]+\*?/g, "")
    .replace(/[{}]/g, " ")
    .replace(/[0-9+\-*/^=_(),.[\]\s\\]/g, "")
    .trim();

  // Leftover letter runs ⇒ prose, not a pure math expression
  if (/[a-zA-Z]{3,}/.test(leftover)) return false;
  return true;
}

function wrapBareLatexExpressions(content: string): string {
  // Split joined correct answers: "\frac{1}{2} or \frac{2}{4}"
  return content
    .split(/(\s+or\s+)/i)
    .map((part) => {
      if (/^\s+or\s+$/i.test(part)) return part;
      if (!isBareLatexExpression(part)) return part;
      const trimmed = part.trim();
      return part.replace(trimmed, `$${trimmed}$`);
    })
    .join("");
}

/**
 * Extract math segments first so markdown (e.g. *italic*) cannot corrupt
 * LaTeX that contains asterisks or other markdown-significant characters.
 * Supports $...$, $$...$$, \(...\), and \[...\].
 */
function extractAndRenderMath(
  content: string,
  renderLatexToHtml: (math: string, displayMode: boolean) => string,
): { text: string; tokens: MathToken[] } {
  const tokens: MathToken[] = [];
  let text = content;
  let tokenIndex = 0;

  const stash = (math: string, displayMode: boolean) => {
    const placeholder = `\u0000MATH${tokenIndex++}\u0000`;
    tokens.push({
      placeholder,
      html: displayMode
        ? `<div class="my-4" data-testid="math-block">${renderLatexToHtml(math, true)}</div>`
        : `<span data-testid="math-inline">${renderLatexToHtml(math, false)}</span>`,
    });
    return placeholder;
  };

  const isDisplayMath = (math: string) =>
    /\\begin\{/.test(math) || /\n/.test(math.trim());

  // Block math first ($$...$$ and \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) =>
    stash(math, true),
  );
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) =>
    stash(math, true),
  );

  // $...$ may span lines (e.g. \begin{array} ... \\ ... \end{array}).
  // [^$\n] previously dropped any delimited math that contained a newline.
  text = text.replace(/(?<!\$)\$(?!\$)([\s\S]*?)\$(?!\$)/g, (_, math: string) =>
    stash(math, isDisplayMath(math)),
  );
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) =>
    stash(math, isDisplayMath(math)),
  );

  return { text, tokens };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyMarkdown(text: string): string {
  let processed = text;
  processed = processed.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  processed = processed.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  processed = processed.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold">$1</strong>',
  );
  processed = processed.replace(
    /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
    "<em>$1</em>",
  );
  return processed;
}

function restoreMathTokens(text: string, tokens: MathToken[]): string {
  let result = text;
  for (const token of tokens) {
    result = result.split(token.placeholder).join(token.html);
  }
  return result;
}

export function MathPreview({
  content,
  className = "",
  renderMarkdown = false,
  katexOptions = {},
}: MathPreviewProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    const renderLatexToHtml = (math: string, displayMode: boolean) => {
      try {
        return katex.renderToString(math, {
          throwOnError: false,
          displayMode,
          ...katexOptions,
        });
      } catch (error) {
        const message =
          error instanceof Error ? escapeHtml(error.message) : "Unknown error";
        return `<span data-testid="math-error" class="text-red-500">LaTeX Error: ${message}</span>`;
      }
    };

    // Normalize line endings / collapse runaway blank lines before layout
    let processedContent = content
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\\\$/g, "\u0000ESCAPED_DOLLAR\u0000");

    // Bare TeX answers like `\frac{1}{2}` → `$\frac{1}{2}$` so KaTeX runs
    processedContent = wrapBareLatexExpressions(processedContent);

    const { text, tokens } = extractAndRenderMath(
      processedContent,
      renderLatexToHtml,
    );

    const safeText = escapeHtml(text);
    let htmlContent = renderMarkdown ? applyMarkdown(safeText) : safeText;
    htmlContent = restoreMathTokens(htmlContent, tokens);
    htmlContent = htmlContent.replace(/\u0000ESCAPED_DOLLAR\u0000/g, "$");

    if (renderMarkdown) {
      // Prefer <br> over <p> so Tailwind `prose` paragraph margins don't
      // elongate question/feedback text.
      htmlContent = htmlContent
        .split(/\n\n/)
        .map((para) => {
          const line = para.trim().replace(/\n/g, "<br>");
          if (!line) return "";
          if (line.startsWith("<h") || line.startsWith("<div")) return line;
          return line;
        })
        .filter(Boolean)
        .join("<br>");
    }

    return htmlContent;
  }, [content, katexOptions, renderMarkdown]);

  if (!renderedContent) {
    return <div data-testid="math-preview-container" className={className} />;
  }

  const containerClass = renderMarkdown
    ? `prose prose-sm max-w-none prose-p:my-0 prose-headings:my-2 ${className}`
    : className;

  return (
    <div
      data-testid="math-preview-container"
      className={containerClass}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
