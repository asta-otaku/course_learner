import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FreeTextInput } from '../free-text-input';

describe('FreeTextInput', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    questionId: 'test-question-1',
    value: '',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(<FreeTextInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Type your answer here...');
    expect(textarea).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<FreeTextInput {...defaultProps} value="My answer" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('My answer');
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    render(<FreeTextInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    // Simulate typing by firing change event directly
    fireEvent.change(textarea, { target: { value: 'Test' } });
    
    // onChange should be called with the new value
    expect(mockOnChange).toHaveBeenCalledWith('Test');
  });

  it('shows character count', () => {
    render(<FreeTextInput {...defaultProps} value="Hello" />);
    
    expect(screen.getByText('5 / 2000')).toBeInTheDocument();
  });

  it('respects custom maxLength', () => {
    render(<FreeTextInput {...defaultProps} value="Hello" maxLength={100} />);
    
    expect(screen.getByText('5 / 100')).toBeInTheDocument();
  });

  it('shows warning when approaching character limit', () => {
    const longText = 'a'.repeat(1850);
    render(<FreeTextInput {...defaultProps} value={longText} />);
    
    const counter = screen.getByText('1850 / 2000');
    expect(counter).toHaveClass('text-orange-600');
  });

  it('shows error when at character limit', () => {
    const maxText = 'a'.repeat(2000);
    render(<FreeTextInput {...defaultProps} value={maxText} />);
    
    const counter = screen.getByText('2000 / 2000');
    expect(counter).toHaveClass('text-red-600');
  });

  it('prevents typing beyond maxLength', async () => {
    const user = userEvent.setup();
    // Start with a value that's one character away from the limit
    const almostMaxText = 'a'.repeat(1999);
    const { rerender } = render(<FreeTextInput {...defaultProps} value={almostMaxText} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(almostMaxText);
    
    // Try to type one more character (should work)
    await user.type(textarea, 'b');
    
    // onChange should be called with the text plus 'b'
    expect(mockOnChange).toHaveBeenCalledWith(almostMaxText + 'b');
    
    // Now simulate that the component has been updated with the new value
    rerender(<FreeTextInput {...defaultProps} value={almostMaxText + 'b'} />);
    mockOnChange.mockClear();
    
    // Try to type another character (should not work)
    await user.type(textarea, 'c');
    
    // onChange should not be called since we're at maxLength
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<FreeTextInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('opacity-60', 'cursor-not-allowed');
  });

  it('shows "Answer submitted" when disabled', () => {
    render(<FreeTextInput {...defaultProps} disabled={true} />);
    
    expect(screen.getByText('Answer submitted')).toBeInTheDocument();
    expect(screen.queryByText('Enter your answer above')).not.toBeInTheDocument();
  });

  it('shows "Enter your answer above" when not disabled', () => {
    render(<FreeTextInput {...defaultProps} />);
    
    expect(screen.getByText('Enter your answer above')).toBeInTheDocument();
    expect(screen.queryByText('Answer submitted')).not.toBeInTheDocument();
  });

  it('applies custom minHeight style', () => {
    render(<FreeTextInput {...defaultProps} minHeight="200px" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ minHeight: '200px' });
  });

  it('has proper accessibility attributes', () => {
    render(<FreeTextInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'question-test-question-1');
    expect(textarea).toHaveAttribute('aria-label', 'Free text answer');
    expect(textarea).toHaveAttribute('aria-describedby', 'char-count-test-question-1');
  });

  it('character count has proper accessibility', () => {
    render(<FreeTextInput {...defaultProps} value="Test" />);
    
    const charCount = screen.getByText('4 / 2000');
    expect(charCount).toHaveAttribute('id', 'char-count-test-question-1');
    expect(charCount).toHaveAttribute('aria-live', 'polite');
  });

  it('respects maxLength by not calling onChange for text beyond limit', () => {
    const { rerender } = render(<FreeTextInput {...defaultProps} value="" maxLength={10} />);
    
    const textarea = screen.getByRole('textbox');
    
    // First, type text within the limit
    fireEvent.change(textarea, { target: { value: 'This is a ' } });
    expect(mockOnChange).toHaveBeenCalledWith('This is a ');
    
    // Update the component with the new value
    rerender(<FreeTextInput {...defaultProps} value="This is a " maxLength={10} />);
    mockOnChange.mockClear();
    
    // Now try to add more text beyond the limit
    fireEvent.change(textarea, { target: { value: 'This is a very long text' } });
    
    // onChange should not be called because the new value exceeds maxLength
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('maintains focus ring on focus', async () => {
    const user = userEvent.setup();
    render(<FreeTextInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    
    expect(textarea).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
  });

  it('handles empty string value gracefully', () => {
    render(<FreeTextInput {...defaultProps} value="" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('');
    expect(screen.getByText('0 / 2000')).toBeInTheDocument();
  });

  it('updates character count in real-time', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FreeTextInput {...defaultProps} value="" />);
    
    expect(screen.getByText('0 / 2000')).toBeInTheDocument();
    
    rerender(<FreeTextInput {...defaultProps} value="Hello" />);
    expect(screen.getByText('5 / 2000')).toBeInTheDocument();
    
    rerender(<FreeTextInput {...defaultProps} value="Hello World" />);
    expect(screen.getByText('11 / 2000')).toBeInTheDocument();
  });
});