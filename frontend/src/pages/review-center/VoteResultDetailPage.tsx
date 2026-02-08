import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Typography, Card, Row, Col, Table, Tag, Space, Button, Progress, message } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { ColumnsType } from 'antd/es/table'
import type { VoteResultArchive, VoteOutcome, VoteStatisticsArchive } from '@/types/review-meeting'
import dayjs from 'dayjs'
import { exportVoteResultsToExcel } from '@/utils/exportVoteResults'

const { Text, Paragraph } = Typography

export function VoteResultDetailPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()

  // 获取投票结果详情
  const { data: resultData, isLoading, error } = useQuery({
    queryKey: ['vote-result', resultId],
    queryFn: () => reviewMeetingService.getVoteResult(Number(resultId)),
  })

  // 添加调试信息
  console.log('VoteResultDetailPage - resultId:', resultId)
  console.log('VoteResultDetailPage - isLoading:', isLoading)
  console.log('VoteResultDetailPage - resultData:', resultData)
  console.log('VoteResultDetailPage - error:', error)

  if (isLoading) return <div>加载中...</div>

  if (error) {
    console.error('加载投票结果详情失败:', error)
    return (
      <div style={{ padding: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/review-center/results')}>
          返回列表
        </Button>
        <div style={{ marginTop: 16 }}>
          <Text type="danger">加载失败：{(error as Error).message || '未知错误'}</Text>
        </div>
      </div>
    )
  }

  if (!resultData?.data) {
    console.warn('投票结果数据不存在')
    return (
      <div style={{ padding: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/review-center/results')}>
          返回列表
        </Button>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">数据不存在</Text>
        </div>
      </div>
    )
  }

  const result: VoteResultArchive = resultData.data
  const stats = result.vote_statistics

  // 计算投票结果
  const calculateVoteOutcome = (stats: VoteStatisticsArchive): VoteOutcome => {
    if (stats.approve_count > stats.reject_count && stats.approve_percentage > 50) {
      return 'approved'
    }
    if (stats.reject_count >= stats.approve_count) {
      return 'rejected'
    }
    return 'pending'
  }

  const outcome = calculateVoteOutcome(stats)
  const outcomeConfig = {
    approved: {
      color: 'success',
      text: '✅ 通过',
      description: '通过票数 > 拒绝票数 且 通过率 > 50%',
    },
    rejected: { color: 'error', text: '❌ 拒绝', description: '拒绝票数 >= 通过票数' },
    pending: {
      color: 'default',
      text: '⏸️ 待定',
      description: '未达到明确的通过或拒绝标准',
    },
  }
  const { color, text, description } = outcomeConfig[outcome]

  // 投票详情表格列
  const voteColumns: ColumnsType<any> = [
    { title: '投票人', dataIndex: 'voter_name', key: 'voter_name', width: 150 },
    {
      title: '投票选项',
      dataIndex: 'vote_option',
      key: 'vote_option',
      width: 120,
      render: (option: string) => {
        const config = {
          approve: { color: 'success', text: '✅ 通过' },
          reject: { color: 'error', text: '❌ 拒绝' },
          abstain: { color: 'default', text: '○ 弃权' },
        }
        const { color, text } = config[option as keyof typeof config]
        return <Tag color={color}>{text}</Tag>
      },
    },
    { title: '评论', dataIndex: 'comment', key: 'comment', ellipsis: true },
    {
      title: '投票时间',
      dataIndex: 'voted_at',
      key: 'voted_at',
      width: 180,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部操作栏 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/review-center/results')}>
            返回列表
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              exportVoteResultsToExcel([result], {
                filename: `投票结果_${result.requirement_id}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
                includeDetails: true,
              })
              message.success('导出成功')
            }}>
            导出当前结果
          </Button>
        </Space>

        {/* 基础信息卡片 */}
        <Card title="基础信息">
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>存档时间：</Text>
              <Text>{dayjs(result.archived_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Col>
            <Col span={8}>
              <Text strong>会议编号：</Text>
              <Text>{result.meeting_no || `ID:${result.meeting_id}`}</Text>
            </Col>
            <Col span={8}>
              <Text strong>需求编号：</Text>
              <Text>{result.requirement_no || `ID:${result.requirement_id}`}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Text strong>需求标题：</Text>
              <Text>{result.requirement_title}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Text strong>投票结果：</Text>
              <Tag color={color} style={{ fontSize: 16, padding: '4px 12px' }}>
                {text}
              </Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {description}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* 投票统计卡片 */}
        <Card title={`投票统计 (共 ${stats.total_votes} 票)`}>
          <Row gutter={16}>
            <Col span={8}>
              <Text>
                <Tag color="success">✅ 支持通过</Tag>
                <Text strong style={{ marginLeft: 8 }}>
                  {stats.approve_count} 票 ({stats.approve_percentage}%)
                </Text>
              </Text>
              <Progress percent={stats.approve_percentage} strokeColor="#52c41a" style={{ marginTop: 8 }} />
            </Col>
            <Col span={8}>
              <Text>
                <Tag color="error">❌ 反对拒绝</Tag>
                <Text strong style={{ marginLeft: 8 }}>
                  {stats.reject_count} 票 ({stats.reject_percentage}%)
                </Text>
              </Text>
              <Progress percent={stats.reject_percentage} strokeColor="#ff4d4f" style={{ marginTop: 8 }} />
            </Col>
            <Col span={8}>
              <Text>
                <Tag>○ 弃权</Tag>
                <Text strong style={{ marginLeft: 8 }}>
                  {stats.abstain_count} 票 ({stats.abstain_percentage}%)
                </Text>
              </Text>
              <Progress percent={stats.abstain_percentage} strokeColor="#d9d9d9" style={{ marginTop: 8 }} />
            </Col>
          </Row>
        </Card>

        {/* 投票详情卡片 */}
        <Card title="投票详情">
          <Table
            columns={voteColumns}
            dataSource={stats.votes}
            rowKey={(record) => `${record.voter_id}-${record.voted_at}`}
            pagination={false}
          />
        </Card>

        {/* 投票规则说明 */}
        <Card title="投票规则说明">
          <Paragraph>
            <ul>
              <li>
                ✅ <Text strong>通过：</Text>通过票数 &gt; 拒绝票数 且 通过率 &gt; 50%
              </li>
              <li>❌ <Text strong>拒绝：</Text>拒绝票数 &gt;= 通过票数</li>
              <li>⏸️ <Text strong>待定：</Text>未达到明确的通过或拒绝标准</li>
            </ul>
          </Paragraph>
        </Card>
      </Space>
    </div>
  )
}

export default VoteResultDetailPage
