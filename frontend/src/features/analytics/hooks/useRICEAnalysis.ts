import { useState, useEffect } from 'react'
import { message } from 'antd'
import { riceService, RICEAnalysisData } from '@/services/rice.service'

/**
 * RICE分析Hook
 * 封装RICE分析的业务逻辑
 */
export const useRICEAnalysis = (requirementId: number | null) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [riceData, setRiceData] = useState<RICEAnalysisData>({
    reach: 5,
    impact: 5,
    confidence: 5,
    effort: 5,
    notes: '',
  })

  /**
   * 加载RICE分析数据
   */
  const loadRICEAnalysis = async (reqId: number) => {
    setLoading(true)
    try {
      const data = await riceService.getRICEAnalysis(reqId)
      console.log('Loaded RICE data:', data)

      if (data) {
        setRiceData({
          reach: data.reach,
          impact: data.impact,
          confidence: data.confidence,
          effort: data.effort,
          notes: data.notes || '',
        })
      } else {
        // 如果没有数据，使用默认值
        resetRICEData()
      }
    } catch (error) {
      console.log('No existing RICE analysis found, starting fresh', error)
      resetRICEData()
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存RICE分析数据
   */
  const saveRICEAnalysis = async (data: RICEAnalysisData) => {
    if (!requirementId) {
      message.warning('请先选择要分析的需求')
      return false
    }

    setSaving(true)
    try {
      const result = await riceService.saveRICEAnalysis(requirementId, data)
      console.log('Saved RICE data:', result)
      message.success('RICE分析保存成功')
      return true
    } catch (error: any) {
      console.error('Failed to save RICE analysis:', error)
      message.error(error?.detail || '保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * 计算RICE分数
   * 公式：(R × I × C) / E
   */
  const calculateRICEScore = (data: RICEAnalysisData): number => {
    const { reach, impact, confidence, effort } = data
    if (effort === 0) return 0
    return Math.round(((reach * impact * confidence) / effort) * 100) / 100
  }

  /**
   * 重置RICE数据为默认值
   */
  const resetRICEData = () => {
    setRiceData({
      reach: 5,
      impact: 5,
      confidence: 5,
      effort: 5,
      notes: '',
    })
  }

  /**
   * 更新RICE数据中的单个字段
   */
  const updateRiceData = (field: keyof RICEAnalysisData, value: string | number) => {
    setRiceData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 当需求ID变化时，加载数据
  useEffect(() => {
    if (requirementId) {
      loadRICEAnalysis(requirementId)
    }
  }, [requirementId])

  return {
    riceData,
    loading,
    saving,
    setRiceData,
    updateRiceData,
    saveRICEAnalysis,
    resetRICEData,
    calculateRICEScore,
  }
}
