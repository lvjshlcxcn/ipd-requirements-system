import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditableCell } from '@/shared/components/editable-cell/EditableCell'

// 模拟 onSave 函数
const mockOnSave = vi.fn()

describe('EditableCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('显示模式', () => {
    it('应该显示格式化的天数', () => {
      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)
      expect(screen.getByText('6天')).toBeInTheDocument()
    })

    it('应该显示小数天数', () => {
      render(<EditableCell value={0.5} recordId={1} onSave={mockOnSave} />)
      expect(screen.getByText('0.5天')).toBeInTheDocument()
    })

    it('应该显示 - 当值为 null 时', () => {
      render(<EditableCell value={null} recordId={1} onSave={mockOnSave} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('应该显示 - 当值为 undefined 时', () => {
      render(<EditableCell value={undefined} recordId={1} onSave={mockOnSave} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('点击时应该进入编辑模式', async () => {
      const user = userEvent.setup()
      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      const displayElement = screen.getByText('6天')
      await user.click(displayElement)

      // 应该显示输入框
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('6')
    })
  })

  describe('编辑模式 - 保存成功', () => {
    it('应该保存新值并退出编辑模式', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      // 进入编辑模式
      await user.click(screen.getByText('6天'))

      // 修改值
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '12')

      // 失焦保存
      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, 12)
      })

      // 应该退出编辑模式并显示新值
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    it('应该支持保存小数天数', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '0.5')

      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, 0.5)
      })
    })

    it('应该支持保存空值', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      // 进入编辑模式
      await user.click(screen.getByText('6天'))

      // 清空值
      const input = screen.getByRole('textbox')
      await user.clear(input)

      // 失焦保存
      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, null)
      })
    })

    it('按 Enter 应该保存', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '10{Enter}')

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, 10)
      })
    })

    it('值未变化时不应该调用 onSave', async () => {
      const user = userEvent.setup()

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })

      // 应该退出编辑模式
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('编辑模式 - 验证', () => {
    it('应该拒绝负数', async () => {
      const user = userEvent.setup()

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '-5')

      // 失焦时应该显示验证错误
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('请输入 0-365 之间的天数')).toBeInTheDocument()
      })

      // 不应该调用 onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('应该拒绝超过 365 的数字', async () => {
      const user = userEvent.setup()

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '400')

      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('请输入 0-365 之间的天数')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('应该拒绝非数字输入', async () => {
      const user = userEvent.setup()

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'abc')

      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('请输入有效数字')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('应该接受 0', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '0')

      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, 0)
      })
    })

    it('应该接受 365', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValueOnce(undefined)

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '365')

      await user.tab()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(1, 365)
      })
    })
  })

  describe('编辑模式 - 取消编辑', () => {
    it('按 Escape 应该取消编辑并恢复原值', async () => {
      const user = userEvent.setup()

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '12')

      // 按 Escape 取消
      await user.keyboard('{Escape}')

      // 应该退出编辑模式
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })

      // 应该恢复显示原值
      expect(screen.getByText('6天')).toBeInTheDocument()

      // 不应该调用 onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('编辑模式 - 保存失败', () => {
    it('保存失败时应该回滚并显示错误提示', async () => {
      const user = userEvent.setup()
      mockOnSave.mockRejectedValueOnce(new Error('Network error'))

      render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      await user.click(screen.getByText('6天'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '12')

      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('保存失败')).toBeInTheDocument()
      })

      // 3秒后错误提示应该消失
      await waitFor(
        () => {
          expect(screen.queryByText('保存失败')).not.toBeInTheDocument()
        },
        { timeout: 4000 }
      )
    })
  })

  describe('外部值更新', () => {
    it('当外部 value 变化时应该更新显示', async () => {
      const { rerender } = render(<EditableCell value={6} recordId={1} onSave={mockOnSave} />)

      expect(screen.getByText('6天')).toBeInTheDocument()

      // 模拟外部值更新
      rerender(<EditableCell value={10} recordId={1} onSave={mockOnSave} />)

      expect(screen.getByText('10天')).toBeInTheDocument()
    })
  })
})
