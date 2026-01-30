import { useState, useEffect } from 'react'
import { message } from 'antd'
import { investService, INVESTAnalysisData } from '@/services/invest.service'

/**
 * INVEST维度配置
 */
export const INVEST_DIMENSIONS = [
  { key: 'independent', label: '独立', description: '需求之间相互独立，减少依赖' },
  { key: 'negotiable', label: '可协商', description: '需求细节可协商调整' },
  { key: 'valuable', label: '有价值', description: '对用户和业务有明显价值' },
  { key: 'estimable', label: '可估算', description: '工作量能够合理估算' },
  { key: 'small', label: '小型', description: '规模适中，可在短期内完成' },
  { key: 'testable', label: '可测试', description: '有明确的验收标准和测试方法' },
] as const

/**
 * INVEST分析Hook
 * 封装INVEST分析的业务逻辑（评分系统）
 */
const INITIAL_STATE: INVESTAnalysisData = {
  independent: 50,
  negotiable: 50,
  valuable: 50,
  estimable: 50,
  small: 50,
  testable: 50,
  notes: '',
}

export const useINVESTAnalysis = (requirementId: number | null) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [investData, setInvestData] = useState<INVESTAnalysisData>(INITIAL_STATE)

  /**
   * 加载INVEST分析数据
   */
  const loadINVESTAnalysis = async (reqId: number) => {
    setLoading(true)
    try {
      const data = await investService.getINVESTAnalysis(reqId)
      console.log('Loaded INVEST data:', data)

      if (data) {
        setInvestData({
          independent: data.independent,
          negotiable: data.negotiable,
          valuable: data.valuable,
          estimable: data.estimable,
          small: data.small,
          testable: data.testable,
          notes: data.notes || '',
        })
      } else {
        // 如果没有数据，使用默认值
        resetINVESTData()
      }
    } catch (error) {
      console.log('No existing INVEST analysis found, starting fresh', error)
      resetINVESTData()
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存INVEST分析数据
   */
  const saveINVESTAnalysis = async (data: INVESTAnalysisData) => {
    if (!requirementId) {
      message.warning('请先选择要分析的需求')
      return false
    }

    setSaving(true)
    try {
      const result = await investService.saveINVESTAnalysis(requirementId, data)
      console.log('Saved INVEST data:', result)
      message.success('INVEST分析保存成功')
      return true
    } catch (error: any) {
      console.error('Failed to save INVEST analysis:', error)
      message.error(error?.detail || '保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * 计算总分（0-600）
   */
  const calculateTotalScore = (): number => {
    return (
      investData.independent +
      investData.negotiable +
      investData.valuable +
      investData.estimable +
      investData.small +
      investData.testable
    )
  }

  /**
   * 计算平均分（0-100）
   */
  const calculateAverageScore = (): string => {
    const total = calculateTotalScore()
    return (total / 6).toFixed(2)
  }

  /**
   * 获取雷达图数据
   */
  const getRadarChartData = () => {
    return INVEST_DIMENSIONS.map((dim) => ({
      dimension: dim.label,
      fullMark: 100,
      score: investData[dim.key] || 0,
      key: dim.key,
    }))
  }

  /**
   * 重置INVEST数据为默认值
   */
  const resetINVESTData = () => {
    setInvestData({ ...INITIAL_STATE })
  }

  /**
   * 更新INVEST数据中的单个字段
   */
  const updateInvestData = (field: keyof INVESTAnalysisData, value: number | string) => {
    setInvestData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 当需求ID变化时，加载数据
  useEffect(() => {
    if (requirementId) {
      loadINVESTAnalysis(requirementId)
    }
  }, [requirementId])

  return {
    investData,
    loading,
    saving,
    setInvestData,
    updateInvestData,
    saveINVESTAnalysis,
    resetINVESTData,
    calculateTotalScore,
    calculateAverageScore,
    getRadarChartData,
    INVEST_DIMENSIONS,
  }
}
