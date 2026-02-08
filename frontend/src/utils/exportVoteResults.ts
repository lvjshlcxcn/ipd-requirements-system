import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'
import type { VoteResultArchive } from '@/types/review-meeting'

export interface ExportOptions {
  filename?: string
  includeDetails?: boolean
}

export const exportVoteResultsToExcel = (data: VoteResultArchive[], options: ExportOptions = {}) => {
  // 1. 转换数据为 Excel 友好格式
  const worksheetData = data.map((item) => {
    const stats = item.vote_statistics

    // 计算投票结果
    let outcome = '待定'
    if (stats.approve_count > stats.reject_count && stats.approve_percentage > 50) {
      outcome = '通过'
    } else if (stats.reject_count >= stats.approve_count) {
      outcome = '拒绝'
    }

    return {
      存档时间: dayjs(item.archived_at).format('YYYY-MM-DD HH:mm'),
      会议ID: item.meeting_id,
      需求编号: item.requirement_id,
      需求标题: item.requirement_title,
      总票数: stats.total_votes,
      通过票数: stats.approve_count,
      通过率: `${stats.approve_percentage}%`,
      拒绝票数: stats.reject_count,
      拒绝率: `${stats.reject_percentage}%`,
      弃权票数: stats.abstain_count,
      弃权率: `${stats.abstain_percentage}%`,
      投票结果: outcome,
    }
  })

  // 2. 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  // 3. 设置列宽
  worksheet['!cols'] = [
    { wch: 20 }, // 存档时间
    { wch: 10 }, // 会议ID
    { wch: 12 }, // 需求编号
    { wch: 40 }, // 需求标题
    { wch: 10 }, // 总票数
    { wch: 12 }, // 通过票数
    { wch: 10 }, // 通过率
    { wch: 12 }, // 拒绝票数
    { wch: 10 }, // 拒绝率
    { wch: 12 }, // 弃权票数
    { wch: 10 }, // 弃权率
    { wch: 10 }, // 投票结果
  ]

  // 4. 如果包含详情,添加第二个工作表
  if (options.includeDetails) {
    const detailData: any[] = []
    data.forEach((item) => {
      item.vote_statistics.votes.forEach((vote) => {
        const optionMap = {
          approve: '通过',
          reject: '拒绝',
          abstain: '弃权',
        }
        detailData.push({
          需求标题: item.requirement_title,
          投票人: vote.voter_name,
          投票选项: optionMap[vote.vote_option as keyof typeof optionMap],
          评论: vote.comment || '无',
          投票时间: vote.voted_at ? dayjs(vote.voted_at).format('YYYY-MM-DD HH:mm') : '',
        })
      })
    })
    const detailWorksheet = XLSX.utils.json_to_sheet(detailData)
    detailWorksheet['!cols'] = [
      { wch: 40 }, // 需求标题
      { wch: 15 }, // 投票人
      { wch: 10 }, // 投票选项
      { wch: 30 }, // 评论
      { wch: 20 }, // 投票时间
    ]

    // 5. 创建工作簿并添加多个工作表
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '投票结果汇总')
    XLSX.utils.book_append_sheet(workbook, detailWorksheet, '投票详情')

    // 6. 导出
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const filename = options.filename || `投票结果_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    saveAs(blob, filename)
  } else {
    // 单个工作表导出
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '投票结果')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const filename = options.filename || `投票结果_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    saveAs(blob, filename)
  }
}
