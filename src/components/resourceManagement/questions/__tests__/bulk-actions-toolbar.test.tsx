import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionsToolbar } from '../bulk-actions-toolbar';

const mutateDelete = vi.fn();
const mutateMove = vi.fn();

vi.mock('@/lib/api/mutations', () => ({
  useDeleteQuestions: () => ({ mutateAsync: mutateDelete }),
  usePutAddQuestionsToFolder: () => ({ mutateAsync: mutateMove }),
}));

// Mock the move dialog component
vi.mock('../move-to-folder-dialog', () => ({
  MoveToFolderDialog: ({ onMove, questionCount, open }: any) => 
    open ? (
      <div data-testid="move-dialog">
        <span>Move {questionCount} questions</span>
        <button onClick={() => onMove('folder-123')}>Move to Test Folder</button>
        <button onClick={() => onMove(null)}>Move to Root</button>
      </div>
    ) : null,
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BulkActionsToolbar', () => {
  const mockOnClearSelection = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no items are selected', () => {
    render(
      <BulkActionsToolbar
        selectedIds={[]}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText('selected')).not.toBeInTheDocument();
  });

  it('displays selected count correctly', () => {
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2', 'q3']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('3 questions selected')).toBeInTheDocument();
  });

  it('displays singular text for single selection', () => {
    render(
      <BulkActionsToolbar
        selectedIds={['q1']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('1 question selected')).toBeInTheDocument();
  });

  it('shows move and delete buttons when items are selected', () => {
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Move to Folder')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    const clearButton = screen.getByRole('button', { name: '' }); // X button has no text
    await user.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
  });

  it('opens move dialog when move button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    await user.click(screen.getByText('Move to Folder'));
    
    expect(screen.getByTestId('move-dialog')).toBeInTheDocument();
    expect(screen.getByText('Move 2 questions')).toBeInTheDocument();
  });

  it('handles successful move operation', async () => {
    const user = userEvent.setup();
    mutateMove.mockResolvedValue({
      status: 200,
      data: { message: 'Moved' },
    });
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    await user.click(screen.getByText('Move to Folder'));
    await user.click(screen.getByText('Move to Test Folder'));

    await waitFor(() => {
      expect(mutateMove).toHaveBeenCalledWith({
        questionIds: ['q1', 'q2'],
        targetFolderId: 'folder-123',
      });
      expect(mockOnClearSelection).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('opens delete confirmation dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    await user.click(screen.getByText('Delete'));
    
    expect(screen.getByText('Delete 2 questions?')).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete the selected questions. This action cannot be undone.')).toBeInTheDocument();
  });

  it('handles successful delete operation', async () => {
    const user = userEvent.setup();
    mutateDelete.mockResolvedValue({
      status: 200,
      data: { message: 'Deleted' },
    });
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1', 'q2']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    // Click the toolbar delete button first
    await user.click(screen.getByRole('button', { name: /delete/i }));
    
    // Then click the confirmation delete button in the dialog
    const confirmDeleteButton = screen.getAllByText('Delete').find(button => 
      button.closest('[role="alertdialog"]')
    );
    if (confirmDeleteButton) {
      await user.click(confirmDeleteButton);
    }

    await waitFor(() => {
      expect(mutateDelete).toHaveBeenCalledWith({ ids: ['q1', 'q2'] });
      expect(mockOnClearSelection).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('handles failed move operation', async () => {
    const user = userEvent.setup();
    mutateMove.mockRejectedValue(new Error('Permission denied'));
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    await user.click(screen.getByText('Move to Folder'));
    await user.click(screen.getByText('Move to Root'));

    await waitFor(() => {
      expect(mutateMove).toHaveBeenCalledWith({
        questionIds: ['q1'],
        targetFolderId: '',
      });
      expect(mockOnClearSelection).not.toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  it('handles failed delete operation', async () => {
    const user = userEvent.setup();
    mutateDelete.mockResolvedValue({
      status: 400,
      data: { message: 'Permission denied' },
    });
    
    render(
      <BulkActionsToolbar
        selectedIds={['q1']}
        onClearSelection={mockOnClearSelection}
        onComplete={mockOnComplete}
      />
    );

    // Click the toolbar delete button first
    await user.click(screen.getByRole('button', { name: /delete/i }));
    
    // Then click the confirmation delete button in the dialog
    const confirmDeleteButton = screen.getAllByText('Delete').find(button => 
      button.closest('[role="alertdialog"]')
    );
    if (confirmDeleteButton) {
      await user.click(confirmDeleteButton);
    }

    await waitFor(() => {
      expect(mutateDelete).toHaveBeenCalledWith({ ids: ['q1'] });
      expect(mockOnClearSelection).not.toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});