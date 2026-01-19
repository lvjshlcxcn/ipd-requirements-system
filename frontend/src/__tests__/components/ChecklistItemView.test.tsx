import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/render'
import { ChecklistItemView } from '@/components/verifications/ChecklistItem'

describe('ChecklistItemView Component', () => {
  const mockItem = {
    id: 1,
    item: 'Test checklist item',
    checked: false,
    notes: '',
  }

  describe('Rendering', () => {
    it('should render the checklist item correctly', () => {
      render(<ChecklistItemView item={mockItem} />)
      
      expect(screen.getByText('Test checklist item')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('should display checked state when item is checked', () => {
      const checkedItem = { ...mockItem, checked: true }
      render(<ChecklistItemView item={checkedItem} />)
      
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('should display notes when provided', () => {
      const itemWithNotes = { ...mockItem, notes: 'Test notes' }
      render(<ChecklistItemView item={itemWithNotes} />)
      
      expect(screen.getByText('备注: Test notes')).toBeInTheDocument()
    })

    it('should show status icon and tag in readOnly mode', () => {
      const checkedItem = { ...mockItem, checked: true }
      render(<ChecklistItemView item={checkedItem} readOnly />)
      
      expect(screen.getByText('已完成')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onToggle when checkbox is clicked', () => {
      const handleToggle = vi.fn()
      render(<ChecklistItemView item={mockItem} onToggle={handleToggle} />)
      
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      
      expect(handleToggle).toHaveBeenCalledTimes(1)
      expect(handleToggle).toHaveBeenCalledWith(true)
    })

    it('should call onNotesChange when notes are entered', () => {
      const handleNotesChange = vi.fn()
      render(<ChecklistItemView item={mockItem} onNotesChange={handleNotesChange} />)
      
      const textarea = screen.getByPlaceholderText('添加备注...')
      fireEvent.change(textarea, { target: { value: 'New notes' } })
      
      expect(handleNotesChange).toHaveBeenCalledTimes(1)
      expect(handleNotesChange).toHaveBeenCalledWith('New notes')
    })

    it('should be disabled when disabled prop is true', () => {
      render(<ChecklistItemView item={mockItem} disabled />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should not show textarea in readOnly mode', () => {
      render(<ChecklistItemView item={mockItem} readOnly />)
      
      expect(screen.queryByPlaceholderText('添加备注...')).not.toBeInTheDocument()
    })

    it('should not show checkbox in readOnly mode', () => {
      render(<ChecklistItemView item={mockItem} readOnly />)
      
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('should handle empty notes gracefully', () => {
      const itemWithoutNotes = { ...mockItem, notes: undefined }
      render(<ChecklistItemView item={itemWithoutNotes} />)
      
      expect(screen.queryByText(/备注:/)).not.toBeInTheDocument()
    })
  })
})
