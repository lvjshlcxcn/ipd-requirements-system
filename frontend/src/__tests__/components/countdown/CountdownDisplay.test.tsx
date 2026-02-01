import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountdownDisplay } from '@/shared/components/countdown/CountdownDisplay'

describe('CountdownDisplay 组件', () => {
  describe('基础渲染测试', () => {
    it('应该渲染倒计时文本', () => {
      render(
        <CountdownDisplay
          formattedCountdown="剩余 25天 3小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      expect(screen.getByText('剩余 25天 3小时')).toBeInTheDocument()
    })

    it('应该渲染 "-" 当不处于倒计时状态', () => {
      render(
        <CountdownDisplay
          formattedCountdown="-"
          isCountingDown={false}
          isOverdue={false}
        />
      )

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('颜色样式测试', () => {
    it('正常倒计时应该显示绿色', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 25天 3小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      const element = container.querySelector('[style*="color"]')
      expect(element).toBeInTheDocument()
      // 验证包含绿色 (#52c41a 或 rgb(82, 196, 26))
      const style = element?.getAttribute('style') || ''
      expect(style).toMatch(/#52c41a|rgb\(82,\s*196,\s*26\)/)
    })

    it('临期警告（<3天）应该显示橙色', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 2天 5小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      const element = container.querySelector('[style*="color"]')
      expect(element).toBeInTheDocument()
      // 验证包含橙色 (#faad14 或 rgb(250, 173, 20))
      const style = element?.getAttribute('style') || ''
      expect(style).toMatch(/#faad14|rgb\(250,\s*173,\s*20\)/)
    })

    it('已超期应该显示红色和 Tag', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="已延期 5天"
          isCountingDown={true}
          isOverdue={true}
        />
      )

      // 验证有 Tag 元素
      const element = container.querySelector('.ant-tag')
      expect(element).toBeInTheDocument()

      // 验证 Tag 有 error 类（Ant Design 的错误颜色）
      expect(element?.className).toContain('ant-tag-error')
    })

    it('非倒计时状态应该显示灰色', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="-"
          isCountingDown={false}
          isOverdue={false}
        />
      )

      const element = container.querySelector('[style*="color"]')
      expect(element).toBeInTheDocument()
      // 验证包含灰色 (#999 或 rgb(153, 153, 153))
      const style = element?.getAttribute('style') || ''
      expect(style).toMatch(/#999|rgb\(153,\s*153,\s*153\)/)
    })
  })

  describe('图标测试', () => {
    it('正常倒计时应该显示时钟图标', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 25天 3小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      // 检查是否有图标元素
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('不倒计时不应该显示图标', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="-"
          isCountingDown={false}
          isOverdue={false}
        />
      )

      // 应该只有文本，没有图标
      const icon = container.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('边界条件测试', () => {
    it('应该处理空字符串', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown=""
          isCountingDown={true}
          isOverdue={false}
        />
      )

      // 应该渲染但不崩溃
      // 验证组件有内容（即使只是图标）
      const content = container.querySelector('span')
      expect(content).toBeInTheDocument()
    })

    it('应该处理非常长的倒计时文本', () => {
      render(
        <CountdownDisplay
          formattedCountdown="剩余 365天 10小时 30分钟"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      expect(screen.getByText('剩余 365天 10小时 30分钟')).toBeInTheDocument()
    })

    it('应该正确处理临期边界（3天整）', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 3天 0小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      // 3天整应该显示绿色（不触发橙色警告）
      const element = container.querySelector('[style*="color"]')
      const style = element?.getAttribute('style') || ''
      expect(style).toMatch(/#52c41a|rgb\(82,\s*196,\s*26\)/)
    })

    it('应该正确处理临期边界（2天23小时）', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 2天 23小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      // 少于3天应该显示橙色
      const element = container.querySelector('[style*="color"]')
      const style = element?.getAttribute('style') || ''
      expect(style).toMatch(/#faad14|rgb\(250,\s*173,\s*20\)/)
    })
  })

  describe('可访问性测试', () => {
    it('应该有正确的语义化 HTML 结构', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="剩余 25天 3小时"
          isCountingDown={true}
          isOverdue={false}
        />
      )

      // 应该有 span 或其他合适的容器元素
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
    })

    it('超期状态应该使用 Tag 组件提供更好的视觉提示', () => {
      const { container } = render(
        <CountdownDisplay
          formattedCountdown="已延期 5天"
          isCountingDown={true}
          isOverdue={true}
        />
      )

      // 应该有 ant-tag 类名
      const tag = container.querySelector('.ant-tag')
      expect(tag).toBeInTheDocument()
      expect(tag).toHaveTextContent('已延期 5天')
    })
  })
})
