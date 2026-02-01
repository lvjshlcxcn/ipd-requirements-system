/** 需求验证列表页面 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  List,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  Tabs,
  Statistic,
  Row,
  Col,
  Pagination,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import verificationService, { VerificationListResponse } from '../../services/verification.service';

const { Title, Text } = Typography;

/** 验证类型映射 */
const VERIFICATION_TYPE_MAP: Record<string, string> = {
  fat: 'FAT (工厂验收测试)',
  sat: 'SAT (现场验收测试)',
  uat: 'UAT (用户验收测试)',
  prototype: '原型验证',
  test: '测试验证',
};

/** 验证结果颜色映射 */
const RESULT_COLOR_MAP: Record<string, string> = {
  not_started: 'default',
  in_progress: 'processing',
  passed: 'success',
  failed: 'error',
  partial_passed: 'warning',
  blocked: 'error',
};

/** 验证结果文本映射 */
const RESULT_TEXT_MAP: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  passed: '通过',
  failed: '失败',
  partial_passed: '部分通过',
  blocked: '阻塞',
};

const VerificationListPage: React.FC = () => {
  const { requirementId } = useParams<{ requirementId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // 使用 useQuery 获取验证清单和摘要
  const { data: response, isLoading: checklistsLoading } = useQuery({
    queryKey: ['verifications', requirementId, currentPage, activeTab],
    queryFn: () => verificationService.getVerifications(parseInt(requirementId!), {
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      verificationType: activeTab === 'all' ? undefined : activeTab,
    }),
    enabled: !!requirementId,
  });

  const checklists = response?.data || [];
  const total = response?.total || 0;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['verificationSummary', requirementId],
    queryFn: () => verificationService.getVerificationSummary(parseInt(requirementId!)),
    enabled: !!requirementId,
  });

  const loading = checklistsLoading || summaryLoading;

  /** 创建新的验证清单 */
  const handleCreate = () => {
    navigate(`/requirements/${requirementId}/verification/create`);
  };

  /** 查看验证清单详情 */
  const handleViewDetail = (checklistId: number) => {
    navigate(`/requirements/${requirementId}/verification/${checklistId}`);
  };

  /** 编辑验证清单 */
  const handleEdit = (checklistId: number) => {
    navigate(`/requirements/${requirementId}/verification/${checklistId}/edit`);
  };

  /** 页码改变 */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /** Tab 改变时重置页码 */
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  /** 渲染验证结果标签 */
  const renderResultTag = (result: string) => {
    return (
      <Tag color={RESULT_COLOR_MAP[result]} icon={
        result === 'passed' ? <CheckCircleOutlined /> :
        result === 'failed' ? <CloseCircleOutlined /> :
        result === 'in_progress' ? <ClockCircleOutlined /> :
        undefined
      }>
        {RESULT_TEXT_MAP[result] || result}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>需求验证</Title>
        <Text type="secondary">管理需求的验收测试清单</Text>
      </div>

      {/* 验证摘要统计 */}
      {summary && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总清单数" value={summary.total_checklists} prefix={<FileTextOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic
                title="已通过"
                value={summary.passed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已失败"
                value={summary.failed}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="进行中"
                value={summary.in_progress}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card
        title="验证清单"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建验证清单
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            { key: 'all', label: `全部 (${total || 0})` },
            { key: 'fat', label: `FAT` },
            { key: 'sat', label: `SAT` },
            { key: 'uat', label: `UAT` },
            { key: 'prototype', label: `原型` },
            { key: 'test', label: `测试` },
          ]}
        />

        {checklists.length === 0 ? (
          <Empty
            description="暂无验证清单"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <>
            <List
              dataSource={checklists}
              renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="view" type="link" onClick={() => handleViewDetail(item.id)}>
                    查看详情
                  </Button>,
                  item.result !== 'passed' && item.result !== 'failed' && (
                    <Button key="edit" type="link" onClick={() => handleEdit(item.id)}>
                      编辑
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.checklist_name}</span>
                      {renderResultTag(item.result)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        类型：{VERIFICATION_TYPE_MAP[item.verification_type]}
                      </Text>
                      <Text type="secondary">
                        检查项：{(item.checklist_items || []).filter(i => i.checked).length} / {item.checklist_items?.length || 0}
                      </Text>
                      {item.verified_by && (
                        <Text type="secondary">
                          验证人ID：{item.verified_by}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />

          {/* 分页组件 */}
          {total > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total) => `共 ${total} 条`}
                showQuickJumper
              />
            </div>
          )}
        </>
        )}
      </Card>
    </div>
  );
};

export default VerificationListPage;
