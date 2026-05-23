/**
 * 审批配置列表页：与「需求模板」一致的卡片网格布局。
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Input,
  Tag,
  Toast,
  Modal,
  Dropdown,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Trash2, Pencil, Plus, Pause, Eye } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchApprovalFlows,
  deleteApprovalFlow,
  activateApprovalFlow,
  deactivateApprovalFlow,
  createApprovalFlowDraft,
  
  subscribeApprovalFlowChange,
  type ApprovalFlowTemplate,
} from './mockData';
import './index.less';

const { Title, Text } = Typography;

const ApprovalConfigPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [flows, setFlows] = useState<ApprovalFlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFlows(await fetchApprovalFlows(keyword));
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeApprovalFlowChange(() => load()), [load]);

  const goEdit = (f: ApprovalFlowTemplate) => {
    navigate(`/requirements/approval-config/builder/${f.id}`);
  };

  const goDetail = (f: ApprovalFlowTemplate) => {
    navigate(`/requirements/approval-config/detail/${f.id}`);
  };

  const handleCreateNew = async () => {
    const draft = await createApprovalFlowDraft();
    navigate(`/requirements/approval-config/builder/${draft.id}`);
  };

  const handleActivate = (f: ApprovalFlowTemplate) => {
    const deptCount = (f.applicable_department_ids ?? []).length;
    if (deptCount === 0) {
      Toast.warning('请先在审批流模板中配置「适用部门」，启用时至少选择 1 个部门');
      goEdit(f);
      return;
    }
    Modal.confirm({
      title: '启用审批流',
      content: `确认启用「${f.name}」？启用后该流程将对所选部门的需求生效。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateApprovalFlow(f.id);
        Toast.success('启用成功');
        load();
      },
    });
  };

  const handleDeactivate = async (f: ApprovalFlowTemplate) => {
    await deactivateApprovalFlow(f.id);
    Toast.success('已停用');
    load();
  };

  const handleDelete = (f: ApprovalFlowTemplate) => {
    Modal.confirm({
      title: '删除审批流',
      content: `确认删除「${f.name}」？此操作不可恢复。`,
      okText: t('common.delete'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteApprovalFlow(f.id);
          Toast.success(t('common.deleteSuccess'));
          load();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  return (
    <div className="approval-config-page">
      <div className="approval-config-page-header">
        <div className="approval-config-page-header-title">
          <Title heading={3} className="title">审批配置</Title>
          <Text type="tertiary">集中管理需求审批流模板。支持同时启用多个模板；通过模板中的「适用部门」决定哪些部门走该流程。</Text>
        </div>
        <Row type="flex" justify="space-between" align="middle" className="approval-config-page-header-toolbar">
          <Col>
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索名称 / 编码 / 描述"
              className="approval-config-page-search-input"
              value={keyword}
              onChange={setKeyword}
              showClear
              maxLength={100}
            />
          </Col>
          <Col>
            <Space>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={handleCreateNew}
              >
                新建审批流
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="approval-config-page-content">
        {!loading && flows.length === 0 ? (
          <EmptyState variant="noData" description="暂无审批流，点击右上角新建" />
        ) : (
          <div className="approval-config-page-grid">
            {flows.map((f) => (
              <div
                key={f.id}
                className={`approval-flow-card ${f.status === 'active' ? 'active' : ''}`}
                onClick={() => goDetail(f)}
              >
                <div className="approval-flow-card-header">
                  <div className="approval-flow-card-title-row">
                    <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 16 }}>
                      {f.name}
                    </Text>
                    {f.status === 'active' && (
                      <Tag color="green" type="solid" size="small">已启用</Tag>
                    )}
                    {f.is_preset && (
                      <Tag color="blue" type="light" size="small">预设</Tag>
                    )}
                  </div>
                  <Dropdown
                    trigger="click"
                    clickToHide
                    position="bottomRight"
                    render={
                      f.is_preset ? (
                        <Dropdown.Menu>
                          <Dropdown.Item
                            icon={<Eye size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              goDetail(f);
                            }}
                          >
                            {t('common.viewDetail')}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      ) : (
                        <Dropdown.Menu>
                          {f.status !== 'active' ? (
                            <Dropdown.Item
                              icon={<CheckCircle size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivate(f);
                              }}
                            >
                              启用
                            </Dropdown.Item>
                          ) : (
                            <Dropdown.Item
                              icon={<Pause size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivate(f);
                              }}
                            >
                              停用
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item
                            icon={<Pencil size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              goEdit(f);
                            }}
                          >
                            编辑
                          </Dropdown.Item>
                          <Dropdown.Item
                            icon={<Trash2 size={14} />}
                            type="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(f);
                            }}
                          >
                            {t('common.delete')}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      )
                    }
                  >
                    <Button
                      icon={<Ellipsis size={16} />}
                      theme="borderless"
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
                <div className="approval-flow-card-meta">
                  <Text type="tertiary" size="small">{f.code}</Text>
                </div>
                <Text
                  type="secondary"
                  size="small"
                  ellipsis={{ rows: 2 }}
                  style={{ marginTop: 8 }}
                >
                  {f.description || '暂无描述'}
                </Text>
                <div className="approval-flow-card-footer">
                  <Tag size="small" color="grey" type="light">
                    {f.approvers.length} 级审批
                  </Tag>
                  {f.approvers.some((a) => a.approval_mode === 'all') && (
                    <Tag size="small" color="orange" type="light">含会签</Tag>
                  )}
                  {f.is_preset && (
                    <Tag size="small" color="grey" type="light">只读</Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalConfigPage;
