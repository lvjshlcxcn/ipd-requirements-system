import { useState, useEffect } from 'react'
import { message } from 'antd'
import { investService, INVESTAnalysisData } from '@/services/invest.service'

/**
 * INVEST分析Hook
 * 封装INVEST分析的业务逻辑
 */
const INITIAL_STATE: INVESTAnalysisData = {
  independent: false,
  negotiable: false,
  valuable: false,
  estimable: false,
  small: false,
  testable: false,
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
   * 计算通过的数量
   */
  const calculatePassedCount = (data: INVESTAnalysisData): number => {
    return Object.values(data)
      .filter(value => typeof value === 'boolean' && value === true)
      .length
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
  const updateInvestData = (field: keyof INVESTAnalysisData, value: boolean | string) => {
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
    calculatePassedCount,
  }
}
