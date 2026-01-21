import React, { useState } from 'react'
import { Modal, Input, Button, Radio, Space, message, Progress } from 'antd'
import insightService from '@/services/insight.service'
import type { Insight } from '@/types/insight'

const { TextArea } = Input

interface TextInsightModalProps {
  visible: boolean
  onClose: () => void
  onAnalysisComplete: (insight: Insight) => void
}

export const TextInsightModal: React.FC<TextInsightModalProps> = ({
  visible,
  onClose,
  onAnalysisComplete,
}) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisMode, setAnalysisMode] = useState<'full' | 'quick'>('full')

  const maxLength = 20000

  const handleAnalyze = async () => {
    if (!text.trim()) {
      message.warning('请输入待分析的文本')
      return
    }

    if (text.length > maxLength) {
      message.error(`文本长度超过${maxLength}字限制`)
      return
    }

    setLoading(true)
    setProgress(0)

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const result = await insightService.analyzeText({
        input_text: text,
        input_source: 'manual',
        analysis_mode: analysisMode,
      })

      clearInterval(progressInterval)
      setProgress(100)

      message.success('分析完成！')
      onAnalysisComplete(result)

      // 重置
      setText('')
      setProgress(0)
      onClose()
    } catch (error: any) {
      clearInterval(progressInterval)
      message.error(`分析失败: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="文本洞察分析"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          取消
        </Button>,
        <Button
          key="analyze"
          type="primary"
          onClick={handleAnalyze}
          loading={loading}
          disabled={!text.trim()}
        >
          {loading ? '分析中...' : '开始AI分析'}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 步骤1: 输入文本 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            步骤1: 粘贴客户访谈文本
          </div>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请粘贴录音转写文本（最多20000字）..."
            rows={10}
            maxLength={maxLength}
            showCount
            disabled={loading}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button size="small" onClick={() => setText('')} disabled={loading}>
              清除文本
            </Button>
          </div>
        </div>

        {/* 步骤2: 选择分析模式 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            步骤2: 选择分析模式
          </div>
          <Radio.Group
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value)}
            disabled={loading}
          >
            <Space direction="vertical">
              <Radio value="full">
                <strong>深度分析</strong> - 完整IPD十问（适合完整访谈，耗时30-60秒）
              </Radio>
              <Radio value="quick">
                <strong>快速分析</strong> - 核心要点提取（适合快速预览，耗时10-20秒）
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* 分析进度 */}
        {loading && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              AI正在分析文本...
            </div>
            <Progress percent={progress} status="active" />
            <div style={{ marginTop: 8, color: '#999' }}>
              {analysisMode === 'full'
                ? '完整分析中，预计需要30-60秒'
                : '快速分析中，预计需要10-20秒'}
            </div>
          </div>
        )}
      </Space>
    </Modal>
  )
}

export default TextInsightModal
