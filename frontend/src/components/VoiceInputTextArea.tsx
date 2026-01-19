import { useState, useRef, useEffect } from 'react'
import { Input, Button, Space, message } from 'antd'
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface VoiceInputTextAreaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  showCount?: boolean
}

export function VoiceInputTextArea({
  value = '',
  onChange,
  placeholder,
  rows = 2,
  maxLength,
  showCount,
}: VoiceInputTextAreaProps) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const valueRef = useRef<string>(value || '')

  // 更新valueRef
  useEffect(() => {
    valueRef.current = value || ''
  }, [value])

  // 检查浏览器支持
  const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  // 初始化语音识别
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true // 持续识别
    recognition.interimResults = true // 显示临时结果
    recognition.lang = 'zh-CN' // 设置为中文

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      // 如果有最终结果，追加到现有文本
      if (finalTranscript) {
        const currentValue = valueRef.current || ''
        const newValue = currentValue + finalTranscript
        valueRef.current = newValue
        onChange?.(newValue)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)

      const errorMessages: Record<string, string> = {
        'no-speech': '没有检测到语音，请重试',
        'audio-capture': '无法访问麦克风',
        'not-allowed': '未授权使用麦克风',
        'network': '网络错误，请检查网络连接',
      }

      const errorMessage = errorMessages[event.error] || `语音识别错误: ${event.error}`
      message.error(errorMessage)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, []) // 移除依赖项，只在组件挂载时执行一次

  const startRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      message.error('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器')
      return
    }

    try {
      recognitionRef.current?.start()
    } catch (error) {
      console.error('Failed to start recognition:', error)
      message.error('启动语音识别失败')
    }
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop()
    } catch (error) {
      console.error('Failed to stop recognition:', error)
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Space.Compact style={{ width: '100%' }}>
      <TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        showCount={showCount}
        style={{ flex: 1 }}
      />
      <Button
        type={isRecording ? 'primary' : 'default'}
        danger={isRecording}
        icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
        onClick={handleToggleRecording}
        style={{ height: 'auto', alignSelf: 'flex-start' }}
        title={isRecording ? '停止录音' : '开始语音输入'}
      >
        {isRecording ? '停止' : '语音'}
      </Button>
    </Space.Compact>
  )
}
