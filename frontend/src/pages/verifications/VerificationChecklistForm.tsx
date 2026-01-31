/** 验证清单表单组件 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Space,
  Typography,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Tag,
  Radio,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import verificationService, {
  VerificationChecklist,
  VerificationChecklistCreate,
  ChecklistItem,
} from '../../services/verification.service';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface VerificationChecklistFormProps {
  mode: 'create' | 'edit' | 'view';
  checklistId?: string;
}

const VerificationChecklistForm: React.FC<VerificationChecklistFormProps> = ({
  mode,
  checklistId,
}) => {
  const { requirementId } = useParams<{ requirementId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState<VerificationChecklist | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

  // 创建清单的 mutation
  const createMutation = useMutation({
    mutationFn: (data: VerificationChecklistCreate) =>
      verificationService.createChecklist(parseInt(requirementId!), data),
    onSuccess: () => {
      message.success('创建成功');
      // 使验证清单查询缓存失效，触发列表页面重新获取数据
      queryClient.invalidateQueries({ queryKey: ['verifications', requirementId] });
      queryClient.invalidateQueries({ queryKey: ['verificationSummary', requirementId] });
      navigate(`/requirements/${requirementId}/verification`);
    },
    onError: (error) => {
      message.error('保存失败');
      console.error(error);
    },
  });

  // 更新清单的 mutation
  const updateMutation = useMutation({
    mutationFn: (data: { checklistItems: ChecklistItem[] }) =>
      verificationService.updateChecklist(
        parseInt(requirementId!),
        parseInt(checklistId!),
        { checklist_items: data.checklistItems }
      ),
    onSuccess: () => {
      message.success('保存成功');
      // 使验证清单查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['verifications', requirementId] });
      queryClient.invalidateQueries({ queryKey: ['verificationSummary', requirementId] });
      navigate(`/requirements/${requirementId}/verification`);
    },
    onError: (error) => {
      message.error('保存失败');
      console.error(error);
    },
  });

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      loadChecklist();
    }
  }, [mode, checklistId]);

  /** 加载验证清单 */
  const loadChecklist = async () => {
    if (!checklistId || !requirementId) return;

    try {
      setLoading(true);
      const checklists = await verificationService.getVerifications(
        parseInt(requirementId)
      );
      const target = checklists.find((c) => c.id === parseInt(checklistId));
      if (target) {
        setChecklist(target);
        setChecklistItems(target.checklist_items);
        form.setFieldsValue({
          verification_type: target.verification_type,
          checklist_name: target.checklist_name,
        });
      }
    } catch (error) {
      message.error('加载验证清单失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /** 添加检查项 */
  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      item: '',
      checked: false,
      notes: '',
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  /** 删除检查项 */
  const handleDeleteItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  /** 更新检查项 */
  const handleUpdateItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  /** 保存清单（不提交结果） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (checklistItems.length === 0) {
        message.warning('请至少添加一个检查项');
        return;
      }

      setSubmitting(true);

      if (mode === 'create') {
        // 创建新清单
        const data: VerificationChecklistCreate = {
          verification_type: values.verification_type,
          checklist_name: values.checklist_name,
          checklist_items: checklistItems,
        };
        createMutation.mutate(data);
      } else if (mode === 'edit') {
        // 更新清单
        updateMutation.mutate({ checklistItems });
      }
    } catch (error) {
      message.error('保存失败');
      console.error(error);
      setSubmitting(false);
    }
  };

  /** 提交验证结果 */
  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);

      await verificationService.submitChecklist(
        parseInt(requirementId!),
        parseInt(checklistId!),
        {
          result: values.result,
          evidence_attachments: {},
          customer_feedback: values.customer_feedback,
          issues_found: values.issues_found,
        }
      );

      message.success('提交成功');
      setSubmitModalVisible(false);
      // 使验证清单查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['verifications', requirementId] });
      queryClient.invalidateQueries({ queryKey: ['verificationSummary', requirementId] });
      navigate(`/requirements/${requirementId}/verification`);
    } catch (error) {
      message.error('提交失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isReadOnly = mode === 'view';
  const checkedCount = checklistItems.filter((i) => i.checked).length;

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/requirements/${requirementId}/verification`)}
          style={{ marginBottom: '16px' }}
        >
          返回验证列表
        </Button>
        <Title level={2}>
          {mode === 'create' ? '创建验证清单' : mode === 'edit' ? '编辑验证清单' : '查看验证清单'}
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          disabled={isReadOnly}
          initialValues={{
            verification_type: 'fat',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="验证类型"
                name="verification_type"
                rules={[{ required: true, message: '请选择验证类型' }]}
              >
                <Select>
                  <Option value="fat">FAT (工厂验收测试)</Option>
                  <Option value="sat">SAT (现场验收测试)</Option>
                  <Option value="uat">UAT (用户验收测试)</Option>
                  <Option value="prototype">原型验证</Option>
                  <Option value="test">测试验证</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="清单名称"
                name="checklist_name"
                rules={[{ required: true, message: '请输入清单名称' }]}
              >
                <Input placeholder="例如：机械系统FAT测试清单" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider orientation="left">检查项</Divider>

        {/* 检查项列表 */}
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {checklistItems.map((item, index) => (
            <Card
              key={item.id}
              size="small"
              style={{ backgroundColor: item.checked ? '#f6ffed' : '#ffffff' }}
              extra={
                !isReadOnly && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    删除
                  </Button>
                )
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>检查项 {index + 1}：</Text>
                  {!isReadOnly && (
                    <Checkbox
                      checked={item.checked}
                      onChange={(e) => handleUpdateItem(item.id, 'checked', e.target.checked)}
                      style={{ marginLeft: '16px' }}
                    >
                      已完成
                    </Checkbox>
                  )}
                  {item.checked && (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: '8px' }}>
                      通过
                    </Tag>
                  )}
                </div>
                {!isReadOnly ? (
                  <Input
                    value={item.item}
                    onChange={(e) => handleUpdateItem(item.id, 'item', e.target.value)}
                    placeholder="请输入检查项内容"
                  />
                ) : (
                  <Text>{item.item || '(空)'}</Text>
                )}
                {!isReadOnly ? (
                  <TextArea
                    value={item.notes}
                    onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                    placeholder="备注信息（可选）"
                    rows={2}
                  />
                ) : item.notes ? (
                  <Text type="secondary">备注：{item.notes}</Text>
                ) : null}
              </Space>
            </Card>
          ))}

          {!isReadOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              block
            >
              添加检查项
            </Button>
          )}

          {checklistItems.length > 0 && (
            <Card size="small">
              <Space>
                <Text strong>进度：</Text>
                <Text>
                  {checkedCount} / {checklistItems.length} 项已完成
                </Text>
                <Tag color={checkedCount === checklistItems.length ? 'success' : 'processing'}>
                  {Math.round((checkedCount / checklistItems.length) * 100)}%
                </Tag>
              </Space>
            </Card>
          )}
        </Space>

        <Divider />

        {/* 操作按钮 */}
        <Space>
          {!isReadOnly && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={submitting}
            >
              {mode === 'create' ? '创建清单' : '保存修改'}
            </Button>
          )}
          {(mode === 'edit' || mode === 'view') && checklist && checklist.result === 'in_progress' && (
            <Button
              type="primary"
              danger
              onClick={() => setSubmitModalVisible(true)}
              disabled={checkedCount === 0}
            >
              提交验证结果
            </Button>
          )}
        </Space>
      </Card>

      {/* 提交验证结果模态框 */}
      <Modal
        title="提交验证结果"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            result: 'passed',
          }}
        >
          <Form.Item
            label="验证结果"
            name="result"
            rules={[{ required: true, message: '请选择验证结果' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="passed">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    通过 - 所有检查项都符合要求
                  </Space>
                </Radio>
                <Radio value="partial_passed">
                  <Space>
                    <Tag color="warning">部分通过</Tag>
                    部分检查项不符合要求，需要改进
                  </Space>
                </Radio>
                <Radio value="failed">
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    失败 - 关键检查项不符合要求
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="发现的问题" name="issues_found">
            <TextArea
              placeholder="描述验证过程中发现的问题"
              rows={4}
            />
          </Form.Item>

          <Form.Item label="客户反馈" name="customer_feedback">
            <TextArea
              placeholder="客户的反馈意见"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              确认提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VerificationChecklistForm;
