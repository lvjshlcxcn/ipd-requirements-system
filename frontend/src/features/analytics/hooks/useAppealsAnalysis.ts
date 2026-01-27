import { useState, useEffect } from 'react'
import { message } from 'antd'
import api from '@/services/api'

/**
 * APPEALS维度接口
 */
export interface AppealsDimension {
  key: string
  label: string
  icon: string
  defaultWeight: number
  description: string
}

/**
 * APPEALS表单值接口
 */
export interface AppealsFormValues {
  [key: string]: string | number
}

/**
 * APPEALS分析Hook
 * 封装APPEALS评估的业务逻辑
 */
export const useAppealsAnalysis = (requirementId: number | null) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState<AppealsFormValues>({})
  const [refresh, setRefresh] = useState(0)

  // APPEALS维度定义
  const appealsDimensions: AppealsDimension[] = [
    { key: 'price', label: '价格/成本', icon: '$', defaultWeight: 0.15, description: '产品或服务的价格竞争力' },
    { key: 'availability', label: '可获得性', icon: 'A', defaultWeight: 0.10, description: '产品获取的难易程度' },
    { key: 'packaging', label: '包装/外观', icon: 'P', defaultWeight: 0.05, description: '产品外观和包装设计' },
    { key: 'performance', label: '性能', icon: 'P', defaultWeight: 0.25, description: '产品功能的性能表现' },
    { key: 'ease_of_use', label: '易用性', icon: 'E', defaultWeight: 0.15, description: '产品使用的便捷程度' },
    { key: 'assurance', label: '保证/可靠性', icon: 'A', defaultWeight: 0.15, description: '产品质量和可靠性保证' },
    { key: 'lifecycle_cost', label: '生命周期成本', icon: 'L', defaultWeight: 0.10, description: '使用和维护的总成本' },
    { key: 'social_acceptance', label: '社会接受度', icon: 'S', defaultWeight: 0.05, description: '社会认可和接受程度' },
  ]

  /**
   * 生成随机权重，总和为1
   */
  const generateRandomWeights = () => {
    const keys = appealsDimensions.map((dim) => dim.key)
    const randomValues = keys.map(() => Math.random())
    const sum = randomValues.reduce((a, b) => a + b, 0)
    const normalizedWeights: AppealsFormValues = {}

    keys.forEach((key, index) => {
      normalizedWeights[key] = Math.round((randomValues[index] / sum) * 100) / 100
    })

    return normalizedWeights
  }

  /**
   * 归一化权重，使总和为1
   */
  const normalizeWeights = (changedKey: string, changedValue: number, currentValues: AppealsFormValues) => {
    const currentWeights: AppealsFormValues = {}

    appealsDimensions.forEach((dim) => {
      currentWeights[dim.key] = parseFloat(currentValues[`${dim.key}_weight`] as string) || dim.defaultWeight
    })

    // 设置变更的权重
    currentWeights[changedKey] = changedValue

    // 计算除变更项外的权重总和
    let otherSum = 0
    appealsDimensions.forEach((dim) => {
      if (dim.key !== changedKey) {
        otherSum += currentWeights[dim.key] as number
      }
    })

    // 归一化其他权重，使总和 = 1
    const remaining = 1 - changedValue
    if (remaining > 0 && otherSum > 0) {
      appealsDimensions.forEach((dim) => {
        if (dim.key !== changedKey) {
          const proportion = (currentWeights[dim.key] as number) / otherSum
          currentWeights[dim.key] = Math.round(proportion * remaining * 100) / 100
        }
      })
    }

    return currentWeights
  }

  /**
   * 加载APPEALS分析数据
   */
  const loadAppealsAnalysis = async (reqId: number) => {
    setLoading(true)
    try {
      const response = await api.get(`/requirements/${reqId}/appeals`)
      const data = response?.data
      console.log('Loaded APPEALS data:', data)

      if (data && data.dimensions) {
        // 用现有数据填充表单
        const newFormValues: AppealsFormValues = {}
        Object.keys(data.dimensions).forEach((key) => {
          newFormValues[`${key}_score`] = data.dimensions[key].score
          newFormValues[`${key}_weight`] = Number(data.dimensions[key].weight)
          newFormValues[`${key}_comment`] = data.dimensions[key].comment || ''
        })
        console.log('Setting form values:', newFormValues)
        setFormValues(newFormValues)
      } else {
        // 重置表单为默认值
        resetFormValues()
      }
    } catch (error) {
      console.log('No existing analysis found, starting fresh', error)
      resetFormValues()
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存APPEALS分析数据
   */
  const saveAppealsAnalysis = async (values: AppealsFormValues) => {
    if (!requirementId) {
      message.warning('请先选择要分析的需求')
      return false
    }

    setSaving(true)
    try {
      const dimensions: any = {}
      appealsDimensions.forEach((dim) => {
        dimensions[dim.key] = {
          score: values[`${dim.key}_score`],
          weight: values[`${dim.key}_weight`],
          comment: values[`${dim.key}_comment`],
        }
      })

      await api.post(`/requirements/${requirementId}/appeals`, dimensions)
      message.success('保存成功')
      return true
    } catch (error: any) {
      console.error('Failed to save analysis:', error)
      message.error(error?.detail || '保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * 重置表单值为默认值
   */
  const resetFormValues = () => {
    const newFormValues: AppealsFormValues = {}
    appealsDimensions.forEach((dim) => {
      newFormValues[`${dim.key}_score`] = 5
      newFormValues[`${dim.key}_weight`] = dim.defaultWeight
      newFormValues[`${dim.key}_comment`] = ''
    })
    setFormValues(newFormValues)
  }

  /**
   * 计算加权总分
   */
  const calculateTotalScore = (): string => {
    let total = 0
    appealsDimensions.forEach((dim) => {
      const score = (formValues[`${dim.key}_score`] as number) || 5
      const weight = (formValues[`${dim.key}_weight`] as number) || dim.defaultWeight
      total += score * weight
    })
    return (total * 10).toFixed(2)
  }

  /**
   * 获取雷达图数据
   */
  const getRadarChartData = () => {
    return appealsDimensions.map((dim) => ({
      dimension: dim.label,
      fullMark: 10,
      score: (formValues[`${dim.key}_score`] as number) || 5,
      key: dim.key,
    }))
  }

  // 当需求ID变化时，加载数据
  useEffect(() => {
    if (requirementId) {
      loadAppealsAnalysis(requirementId)
    }
  }, [requirementId])

  return {
    appealsDimensions,
    formValues,
    loading,
    saving,
    setFormValues,
    setRefresh,
    loadAppealsAnalysis,
    saveAppealsAnalysis,
    resetFormValues,
    generateRandomWeights,
    normalizeWeights,
    calculateTotalScore,
    getRadarChartData,
  }
}
