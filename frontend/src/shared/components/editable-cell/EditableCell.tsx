import { useState, useRef, useEffect } from 'react'
import { Input, Space } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd'

export interface EditableCellProps {
  value: number | null
  recordId: number
  onSave: (id: number, value: number | null) => Promise<void>
}

/**
 * 可编辑单元格组件 - 用于表格内联编辑
 *
 * 功能：
 * - 点击进入编辑模式
 * - 失焦或按 Enter 自动保存
 * - 按 Esc 取消编辑
 * - 支持验证（0-99 的整数或空值）
 * - 保存失败自动回滚并显示错误提示
 */
export function EditableCell({ value, recordId, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [originalValue, setOriginalValue] = useState<number | null>(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [validationError, setValidationError] = useState<string>('')
  const inputRef = useRef<InputRef>(null)

  // 当外部 value 变化时更新本地状态
  useEffect(() => {
    setOriginalValue(value)
  }, [value])

  // 格式化显示
  const displayValue = value !== null && value !== undefined ? `${value}天` : '-'

  // 验证输入
  const validateInput = (val: string): string => {
    if (!val || val.trim() === '') {
      return '' // 允许空值
    }
    const num = Number.parseFloat(val)
    if (Number.isNaN(num)) {
      return '请输入有效数字'
    }
    if (num < 0 || num > 365) {
      return '请输入 0-365 之间的天数'
    }
    return ''
  }

  // 转换输入值为数字或 null
  const parseValue = (val: string): number | null => {
    if (!val || val.trim() === '') {
      return null
    }
    return Number.parseFloat(val)
  }

  // 开始编辑
  const handleStartEdit = () => {
    setInputValue(value !== null && value !== undefined ? String(value) : '')
    setEditing(true)
    setError('')
    setValidationError('')
    // 自动聚焦并选中全部文本
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  // 保存
  const handleSave = async () => {
    const val = inputValue.trim()

    // 验证
    const validationErr = validateInput(val)
    if (validationErr) {
      setValidationError(validationErr)
      return
    }

    const parsedValue = parseValue(val)

    // 如果值没有变化，直接退出编辑模式
    if (parsedValue === originalValue) {
      setEditing(false)
      return
    }

    setSaving(true)
    setError('')
    setValidationError('')

    try {
      await onSave(recordId, parsedValue)
      setOriginalValue(parsedValue)
      setEditing(false)
    } catch (err) {
      // 回滚到原值
      setInputValue(originalValue !== null ? String(originalValue) : '')
      setError('保存失败')
      // 3秒后清除错误提示
      setTimeout(() => {
        setError('')
      }, 3000)
    } finally {
      setSaving(false)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setInputValue(originalValue !== null ? String(originalValue) : '')
    setEditing(false)
    setError('')
    setValidationError('')
  }

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // 渲染编辑模式
  if (editing) {
    return (
      <Space>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // 实时验证
            const err = validateInput(e.target.value)
            setValidationError(err)
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          status={error ? 'error' : validationError ? 'error' : undefined}
          style={{ width: '80px' }}
          disabled={saving}
          placeholder="天数"
        />
        {saving && <LoadingOutlined style={{ color: '#1890ff' }} />}
        {(error || validationError) && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              fontSize: '12px',
              color: '#ff4d4f',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              zIndex: 1,
              backgroundColor: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
          >
            {error || validationError}
          </div>
        )}
      </Space>
    )
  }

  // 渲染显示模式
  return (
    <span
      onClick={handleStartEdit}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
        display: 'inline-block',
        minWidth: '60px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f0f0'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {displayValue}
    </span>
  )
}
