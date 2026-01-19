/** 验证状态卡片组件 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Typography,
  Spin,
  Button,
  Progress,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RightOutlined,
} from '@ant-design/icons';
import verificationService, { VerificationSummary } from '../../services/verification.service';

const { Text } = Typography;

interface VerificationStatusCardProps {
  requirementId: number;
}

const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  requirementId,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<VerificationSummary | null>(null);

  useEffect(() => {
    loadSummary();
  }, [requirementId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await verificationService.getVerificationSummary(requirementId);
      setSummary(data);
    } catch (error) {
      console.error('加载验证摘要失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /** 计算完成率 */
  const getCompletionRate = () => {
    if (!summary || summary.total_checklists === 0) return 0;
    const completed = summary.passed + summary.failed;
    return Math.round((completed / summary.total_checklists) * 100);
  };

  /** 获取整体状态 */
  const getOverallStatus = () => {
    if (!summary || summary.total_checklists === 0) {
      return { text: '未开始验证', color: 'default' };
    }

    const completed = summary.passed + summary.failed;
    if (completed < summary.total_checklists) {
      return { text: '验证进行中', color: 'processing' };
    }

    if (summary.failed > 0) {
      return { text: '验证未通过', color: 'error' };
    }

    return { text: '验证已通过', color: 'success' };
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  const status = getOverallStatus();
  const completionRate = getCompletionRate();

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>需求验证状态</span>
        </Space>
      }
      extra={
        <Button
          type="link"
          onClick={() => navigate(`/requirements/${requirementId}/verification`)}
        >
          查看详情 <RightOutlined />
        </Button>
      }
    >
      {!summary || summary.total_checklists === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">暂无验证记录</Text>
        </div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 整体状态 */}
          <div>
            <Text strong>整体状态：</Text>
            <Tag color={status.color} style={{ marginLeft: '8px' }}>
              {status.text}
            </Tag>
          </div>

          {/* 完成进度 */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>完成进度：</Text>
              <Text style={{ marginLeft: '8px' }}>
                {summary.passed + summary.failed} / {summary.total_checklists}
              </Text>
            </div>
            <Progress
              percent={completionRate}
              status={completionRate === 100 ? (summary.failed > 0 ? 'exception' : 'success') : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': summary.failed > 0 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </div>

          {/* 统计数据 */}
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总清单"
                value={summary.total_checklists}
                valueStyle={{ fontSize: '18px' }}
              />
            </Col>
            <Col span={6}>
              <Tooltip title="已通过验收">
                <Statistic
                  title={
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>已通过</span>
                    </Space>
                  }
                  value={summary.passed}
                  valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                />
              </Tooltip>
            </Col>
            <Col span={6}>
              <Tooltip title="未通过验收">
                <Statistic
                  title={
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>未通过</span>
                    </Space>
                  }
                  value={summary.failed}
                  valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                />
              </Tooltip>
            </Col>
            <Col span={6}>
              <Tooltip title="正在进行中">
                <Statistic
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      <span>进行中</span>
                    </Space>
                  }
                  value={summary.in_progress}
                  valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                />
              </Tooltip>
            </Col>
          </Row>
        </Space>
      )}
    </Card>
  );
};

export default VerificationStatusCard;
