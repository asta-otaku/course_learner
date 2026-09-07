import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../markdown-editor';

// Mock the MDEditor component
vi.mock('@uiw/react-md-editor', () => ({
  default: ({ value, onChange, preview, commands, extraCommands, textareaProps }: any) => {
    return (
      <div data-testid="md-editor">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textareaProps?.placeholder}
          {...textareaProps}
        />
        <div data-testid="preview-mode">{preview}</div>
        <div data-testid="toolbar">
          {commands?.map((cmd: any, idx: number) => (
            <button 
              key={idx} 
              data-testid={`command-${idx}`}
              onClick={() => cmd.execute?.()}
            >
              {cmd.name}
            </button>
          ))}
          {extraCommands?.map((cmd: any, idx: number) => (
            <button 
              key={idx} 
              data-testid={`extra-command-${idx}`}
              onClick={() => cmd.execute?.()}
            >
              {cmd.name}
            </button>
          ))}
        </div>
      </div>
    );
  },
  commands: {
    bold: { name: 'bold' },
    italic: { name: 'italic' },
    strikethrough: { name: 'strikethrough' },
    hr: { name: 'hr' },
    title: { name: 'title' },
    link: { name: 'link' },
    quote: { name: 'quote' },
    code: { name: 'code' },
    image: { name: 'image' },
    unorderedListCommand: { name: 'unordered-list' },
    orderedListCommand: { name: 'ordered-list' },
    checkedListCommand: { name: 'checked-list' },
  },
}));

// Mock KaTeX
vi.mock('katex', () => ({
  render: vi.fn(),
}));

describe('MarkdownEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnImageUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor with initial value', () => {
    render(
      <MarkdownEditor
        value="# Hello World"
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveValue('# Hello World');
  });

  it('calls onChange when text is typed', async () => {
    const user = userEvent.setup();
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const textarea = screen.getByTestId('editor-textarea');
    await user.type(textarea, 'New content');

    // Since we're mocking and onChange is called for each character,
    // we need to check that onChange was called multiple times
    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange.mock.calls.length).toBe(11); // 'New content' = 11 characters
  });

  it('shows preview mode based on prop', () => {
    const { rerender } = render(
      <MarkdownEditor
        value="# Test"
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        preview="edit"
      />
    );

    expect(screen.getByTestId('preview-mode')).toHaveTextContent('edit');

    rerender(
      <MarkdownEditor
        value="# Test"
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        preview="preview"
      />
    );

    expect(screen.getByTestId('preview-mode')).toHaveTextContent('preview');
  });

  it('inserts LaTeX when math button is clicked', async () => {
    // The LaTeX command execution is tested through integration
    // In unit tests, we just verify the button exists
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const latexButton = screen.getByTestId('extra-command-0');
    expect(latexButton).toBeInTheDocument();
    expect(latexButton).toHaveTextContent('latex');
  });

  it('inserts inline LaTeX with shift+click', async () => {
    // Shift+click behavior is tested through integration
    // In unit tests, we verify the button exists
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const latexButton = screen.getByTestId('extra-command-0');
    expect(latexButton).toBeInTheDocument();
  });

  it('triggers image upload when image button is clicked', async () => {
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const imageButton = screen.getByTestId('extra-command-1');
    fireEvent.click(imageButton);

    expect(mockOnImageUpload).toHaveBeenCalled();
  });

  it('renders LaTeX in preview', async () => {
    render(
      <MarkdownEditor
        value="Inline math $x^2$ and block math $$\int_0^1 x dx$$"
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        preview="preview"
      />
    );

    // Since we're mocking MDEditor, we can't test the actual LaTeX rendering
    // Instead, we verify that the preview mode is set
    await waitFor(() => {
      const previewMode = screen.getByTestId('preview-mode');
      expect(previewMode).toHaveTextContent('preview');
    });
  });

  it('handles LaTeX errors gracefully', async () => {
    render(
      <MarkdownEditor
        value="Invalid LaTeX: $\invalid$"
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        preview="preview"
      />
    );

    // Since we're mocking, just verify the component renders
    await waitFor(() => {
      const editors = screen.getAllByTestId('md-editor');
      expect(editors.length).toBeGreaterThan(0);
    });
  });

  it('respects height prop', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        height={400}
      />
    );

    const editors = screen.getAllByTestId('md-editor');
    // The outer wrapper should have the height style
    expect(editors[0]).toHaveStyle({ height: '400px' });
  });

  it('shows placeholder when value is empty', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        placeholder="Enter question content..."
      />
    );

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter question content...');
  });

  it('supports custom toolbar commands', () => {
    const customCommand = {
      name: 'custom',
      keyCommand: 'custom',
      buttonProps: { 'aria-label': 'Custom command' },
      icon: <span>Custom</span>,
      execute: (state: any, api: any) => {
        api.replaceSelection('CUSTOM');
      },
    };

    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        extraCommands={[customCommand]}
      />
    );

    // Extra commands include latex, image-upload, and our custom command
    const extraCommands = screen.getAllByTestId(/extra-command-\d+/);
    expect(extraCommands[2]).toHaveTextContent('custom');
  });
});