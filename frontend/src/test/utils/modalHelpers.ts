/**
 * Modal测试辅助函数
 * 处理Ant Design Modal的常见测试问题
 */

import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * 等待Modal打开并查找按钮
 * @param modalTitle Modal标题
 * @param buttonText 按钮文本
 * @returns 按钮元素
 */
export async function findModalButton(buttonText: string) {
  await waitFor(
    () => {
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    },
    { timeout: 3000 }
  )

  // 获取所有按钮并找到匹配的
  const allButtons = screen.getAllByRole('button')
  const button = allButtons.find((btn) => btn.textContent?.includes(buttonText))

  if (!button) {
    const availableTexts = allButtons.map((b) => b.textContent).join(', ')
    throw new Error(
      `Button with text "${buttonText}" not found. Available buttons: ${availableTexts}`
    )
  }

  return button
}

/**
 * 等待并点击Modal中的按钮
 * @param buttonText 按钮文本
 */
export async function clickModalButton(buttonText: string) {
  const button = await findModalButton(buttonText)
  await userEvent.click(button)
}

/**
 * 等待元素出现
 * @param text 文本内容
 * @param selector 选择器类型
 */
export async function waitForText(text: string, selector: 'text' | 'role' = 'text') {
  await waitFor(
    () => {
      if (selector === 'text') {
        expect(screen.getByText(text)).toBeInTheDocument()
      } else {
        expect(screen.getByRole(text as any)).toBeInTheDocument()
      }
    },
    { timeout: 5000 }
  )
}

/**
 * 安全的输入操作
 * @param labelText label文本
 * @param text 输入内容
 */
export async function safeType(labelText: string, text: string) {
  await waitFor(
    () => {
      const input = screen.getByLabelText(labelText)
      expect(input).toBeInTheDocument()
    },
    { timeout: 3000 }
  )

  const input = screen.getByLabelText(labelText)
  await userEvent.type(input, text)
}
