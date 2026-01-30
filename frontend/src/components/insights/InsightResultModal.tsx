import React from 'react'
import { Modal, Descriptions, Tag, Divider, Card, Space, Button, message } from 'antd'
import type { Insight } from '@/types/insight'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  UserOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons'

interface InsightResultModalProps {
  visible: boolean
  insight: Insight | null
  onClose: () => void
}

export const InsightResultModal: React.FC<InsightResultModalProps> = ({
  visible,
  insight,
  onClose,
}) => {
  const [exporting, setExporting] = React.useState(false)

  if (!insight) return null

  const { analysis_result } = insight

  // 处理打印
  const handlePrint = () => {
    const content = document.getElementById('insight-content')
    if (!content) {
      message.error('未找到可打印内容')
      return
    }

    // 保存原始样式
    const originalMaxHeight = content.style.maxHeight
    const originalOverflow = content.style.overflowY

    // 临时展开全部内容
    content.style.maxHeight = 'none'
    content.style.overflowY = 'visible'

    // 打印
    window.print()

    // 恢复样式
    setTimeout(() => {
      content.style.maxHeight = originalMaxHeight
      content.style.overflowY = originalOverflow
    }, 100)
  }

  // 处理导出PDF
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const content = document.getElementById('insight-content')
      if (!content) {
        message.error('未找到导出内容')
        return
      }

      // 保存原始样式
      const originalMaxHeight = content.style.maxHeight
      const originalOverflow = content.style.overflowY

      try {
        // 临时展开全部内容
        content.style.maxHeight = 'none'
        content.style.overflowY = 'visible'

        // 等待渲染
        await new Promise(resolve => setTimeout(resolve, 300))

        // 获取内容的实际尺寸
        const contentHeight = content.scrollHeight
        const contentWidth = content.scrollWidth

        console.log('[Export] 内容尺寸:', { width: contentWidth, height: contentHeight })

        // 转换为canvas，使用原始尺寸
        const canvas = await html2canvas(content, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
        })

        console.log('[Export] Canvas尺寸:', { width: canvas.width, height: canvas.height })

        // 计算PDF尺寸（A4竖向）
        const pdfWidth = 210
        const pdfHeight = 297
        const margin = 15 // 增加边距避免内容贴边

        // 计算图片在PDF中的尺寸（保持比例）
        const imgWidth = pdfWidth - 2 * margin
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        console.log('[Export] PDF图片尺寸 (mm):', { width: imgWidth.toFixed(2), height: imgHeight.toFixed(2) })

        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgData = canvas.toDataURL('image/png', 1.0)

        // 计算单页可用高度
        const pageHeight = pdfHeight - 2 * margin
        console.log('[Export] 单页可用高度:', pageHeight.toFixed(2), 'mm')

        // 如果内容高度超过单页，需要分割成多页
        let heightLeft = imgHeight
        let position = margin

        // 添加第一页
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // 添加后续页面
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        console.log('[Export] 总页数:', pdf.getNumberOfPages())

        // 下载PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const fileName = `AI洞察_${insight.insight_number}_${timestamp}.pdf`
        pdf.save(fileName)

        message.success('PDF导出成功！')
      } finally {
        // 恢复样式
        content.style.maxHeight = originalMaxHeight
        content.style.overflowY = originalOverflow
      }
    } catch (error) {
      console.error('PDF导出失败:', error)
      message.error('PDF导出失败，请使用打印功能')
    } finally {
      setExporting(false)
    }
  }

  // 优先级颜色映射
  const priorityColorMap: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  }

  const priorityLabelMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }

  const frequencyLabelMap: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    occasional: '偶尔',
  }

  const sentimentLabelMap: Record<string, string> = {
    frustrated: '😞 沮丧/焦虑',
    neutral: '😐 中立',
    satisfied: '😊 满意',
  }

  const urgencyLabelMap: Record<string, string> = {
    high: '🔴 高',
    medium: '🟡 中',
    low: '🟢 低',
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div>📊 AI洞察分析结果</div>
            <div style={{ fontSize: 12, fontWeight: 'normal', marginTop: 4 }}>
              编号: <Tag color="blue">{insight.insight_number}</Tag>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportPDF}
              loading={exporting}
            >
              导出PDF
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      style={{ top: 20 }}
    >
      <div id="insight-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* IPD需求十问 */}
        <Card title="🎯 IPD需求十问" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="谁提出的需求">
              {analysis_result.q1_who || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="为什么提出">
              {analysis_result.q2_why || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="什么问题">
              {analysis_result.q3_what_problem || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前解决方案">
              {analysis_result.q4_current_solution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前存在的问题">
              {analysis_result.q5_current_issues || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="理想解决方案">
              {analysis_result.q6_ideal_solution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              {analysis_result.q7_priority && (
                <Tag color={priorityColorMap[analysis_result.q7_priority]}>
                  {priorityLabelMap[analysis_result.q7_priority]}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="频率">
              {analysis_result.q8_frequency
                ? frequencyLabelMap[analysis_result.q8_frequency]
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="影响范围">
              {analysis_result.q9_impact_scope || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="价值">
              {analysis_result.q10_value || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 用户画像 */}
        {analysis_result.user_persona && (
          <Card
            title={
              <Space>
                <UserOutlined />
                用户画像
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="角色">
                {analysis_result.user_persona.role || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {analysis_result.user_persona.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="人群特征">
                {analysis_result.user_persona.demographics || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="痛点">
                {Array.isArray(analysis_result.user_persona.pain_points)
                  ? analysis_result.user_persona.pain_points.join('、')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目标">
                {Array.isArray(analysis_result.user_persona.goals)
                  ? analysis_result.user_persona.goals.join('、')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 场景 */}
        {analysis_result.scenario && (
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                场景分析
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="上下文">
                {analysis_result.scenario.context || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="环境">
                {analysis_result.scenario.environment || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="触发因素">
                {analysis_result.scenario.trigger || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="频率">
                {analysis_result.scenario.frequency || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 情感标签 */}
        {analysis_result.emotional_tags && (
          <Card
            title={
              <Space>
                <HeartOutlined />
                情感标签
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>紧急度：</strong>
                {analysis_result.emotional_tags.urgency && (
                  <Tag style={{ marginLeft: 8 }}>
                    {urgencyLabelMap[analysis_result.emotional_tags.urgency]}
                  </Tag>
                )}
              </div>
              <div>
                <strong>重要性：</strong>
                {analysis_result.emotional_tags.importance && (
                  <Tag style={{ marginLeft: 8 }}>
                    {urgencyLabelMap[analysis_result.emotional_tags.importance]}
                  </Tag>
                )}
              </div>
              <div>
                <strong>情感倾向：</strong>
                {analysis_result.emotional_tags.sentiment && (
                  <span style={{ marginLeft: 8 }}>
                    {sentimentLabelMap[analysis_result.emotional_tags.sentiment]}
                  </span>
                )}
              </div>
              <div>
                <strong>情感关键词：</strong>
                {Array.isArray(analysis_result.emotional_tags.emotional_keywords) && (
                  <div style={{ marginTop: 8 }}>
                    {analysis_result.emotional_tags.emotional_keywords.map(
                      (keyword, index) => (
                        <Tag key={index} color="blue">
                          {keyword}
                        </Tag>
                      )
                    )}
                  </div>
                )}
              </div>
            </Space>
          </Card>
        )}

        {/* 元数据 */}
        <Divider />
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <div>分析ID: {insight.id}</div>
          <div>
            分析时间: {new Date(insight.created_at).toLocaleString('zh-CN')}
          </div>
          <div>文本长度: {insight.text_length} 字符</div>
        </div>
      </div>
    </Modal>
  )
}

export default InsightResultModal
