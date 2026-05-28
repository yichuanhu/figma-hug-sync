/**
 * 审批配置列表页（FEAT-017 STORY-016 + FEAT-025 STORY-001）
 *
 * 通过 `businessType` + `basePath` 复用：
 *   - REQUIREMENT      → /requirements/approval-config
 *   - PROCESS_PUBLISH  → /dev-center/publish-approval-templates
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
  SideSheet,
  Tooltip,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Trash2, Pencil, Plus, Pause, Eye, Copy } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchApprovalFlows,
  deleteApprovalFlow,
  activateApprovalFlow,
  deactivateApprovalFlow,
  subscribeApprovalFlowChange,
  type ApprovalFlowTemplate,
  type ApprovalBusinessType,
} from './mockData';
import ApprovalFlowBuilder from './components/ApprovalFlowBuilder';
import './index.less';

const { Title, Text } = Typography;

interface ApprovalConfigPageProps {
  businessType?: ApprovalBusinessType;
  basePath?: string;
  pageTitle?: string;
  pageDescription?: string;
  createButtonText?: string;
  tabsSlot?: React.ReactNode;
}

const ApprovalConfigPage = ({
  businessType = 'REQUIREMENT',
  basePath = '/requirements/approval-config',
  pageTitle,
  pageDescription,
  createButtonText,
  tabsSlot,
}: ApprovalConfigPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [flows, setFlows] = useState<ApprovalFlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  // 详情抽屉 —— 仅用于查看；新建/编辑统一跳转新页面
  const [detailId, setDetailId] = useState<string | null>(null);
  // 基于模板创建：弹窗选择预设
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);

  const isPublish = businessType === 'PROCESS_PUBLISH';
  const isOffline = businessType === 'PROCESS_OFFLINE';
  const flowLabel = isPublish ? '发布审批模板' : isOffline ? '停用审批模板' : '审批流';
  const businessLabel = isPublish ? '流程发布' : isOffline ? '流程停用' : '需求';
  const resolvedTitle = pageTitle ?? (isPublish ? '发布审批模板' : isOffline ? '停用审批模板' : '评审与评估流程配置');
  const resolvedDescription = pageDescription ?? (isPublish
    ? '管理流程发布审批模板。通过模板中的「适用部门」决定哪些部门的流程发布需要走审批。'
    : isOffline
    ? '管理流程停用审批模板。通过模板中的「适用部门」决定哪些部门的流程下线需要走审批。'
    : '集中管理需求审批流模板。支持同时启用多个模板；通过模板中的「适用部门」决定哪些部门走该流程。');
  const resolvedCreateText = createButtonText ?? (isPublish ? '新建发布审批' : isOffline ? '新建停用审批' : '新建审批流');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setFlows(await fetchApprovalFlows(keyword, businessType));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [keyword, businessType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeApprovalFlowChange(() => load(true)), [load]);

  const goEdit = (f: ApprovalFlowTemplate) => navigate(`${basePath}/builder/${f.id}`);
  const goDetail = (f: ApprovalFlowTemplate) => setDetailId(f.id);
  const handleCreateNew = () => navigate(`${basePath}/builder/new`);
  const handleCloneFromPreset = (sourceId: string) => {
    setPresetPickerVisible(false);
    navigate(`${basePath}/builder/new?preset=${encodeURIComponent(sourceId)}`);
  };

  const presetFlows = flows.filter((f) => f.is_preset);
  const hasPresets = presetFlows.length > 0;

  const handleActivate = (f: ApprovalFlowTemplate) => {
    const deptCount = (f.applicable_department_ids ?? []).length;
    if (deptCount === 0) {
      Toast.warning('请先在模板中配置「适用部门」，启用时至少选择 1 个部门');
      goEdit(f);
      return;
    }
    Modal.confirm({
      title: `启用${flowLabel}`,
      content: `确认启用「${f.name}」？启用后将对所选部门的${businessLabel}生效。`,
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
      title: `删除${flowLabel}`,
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
          <Title heading={3} className="title">{resolvedTitle}</Title>
          <Text type="tertiary">{resolvedDescription}</Text>
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
              <Tooltip content={!hasPresets ? '暂无可用预设模板' : ''} position="bottom">
                <span style={{ display: 'inline-block' }}>
                  <Button
                    icon={<Copy size={16} strokeWidth={2} />}
                    disabled={!hasPresets}
                    onClick={() => setPresetPickerVisible(true)}
                  >
                    基于模板创建
                  </Button>
                </span>
              </Tooltip>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={handleCreateNew}
              >
                {resolvedCreateText}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {tabsSlot && <div className="approval-config-page-tabs">{tabsSlot}</div>}

      <div className="approval-config-page-content">
        {!loading && flows.length === 0 ? (
          <EmptyState variant="noData" description={`暂无${flowLabel}，点击右上角新建`} />
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
                    {f.status === 'active' && !f.is_preset && (
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
                          <Dropdown.Item
                            icon={<Copy size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloneFromPreset(f.id);
                            }}
                          >
                            基于此模板创建
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
                            icon={<Copy size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloneFromPreset(f.id);
                            }}
                          >
                            基于此模板创建
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

      {/* 详情抽屉 —— 仅查看；编辑统一跳转新页面 */}
      <SideSheet
        visible={!!detailId}
        onCancel={() => setDetailId(null)}
        mask={false}
        width={900}
        headerStyle={{ display: 'none' }}
        bodyStyle={{ padding: 0 }}
        closeOnEsc
      >
        {detailId && (
          <ApprovalFlowBuilder
            key={detailId}
            businessType={businessType}
            basePath={basePath}
            embedded
            embeddedId={detailId}
            embeddedView
            onEmbeddedClose={() => {
              setDetailId(null);
              load(true);
            }}
            onEmbeddedSwitchEdit={(id) => {
              setDetailId(null);
              navigate(`${basePath}/builder/${id}`);
            }}
            onEmbeddedNavigate={(id) => setDetailId(id)}
          />
        )}
      </SideSheet>

      {/* 基于预设模板创建 */}
      <Modal
        title="基于模板创建"
        visible={presetPickerVisible}
        onCancel={() => setPresetPickerVisible(false)}
        footer={null}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {presetFlows.map((f) => (
            <div
              key={f.id}
              onClick={() => handleCloneFromPreset(f.id)}
              style={{
                padding: 12,
                border: '1px solid var(--semi-color-border)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 500 }}>{f.name}</div>
              <Text type="tertiary" size="small">{f.code}</Text>
              <div style={{ marginTop: 4 }}>
                <Text size="small" type="secondary">{f.description || '暂无描述'}</Text>
              </div>
            </div>
          ))}
          {presetFlows.length === 0 && (
            <Text type="tertiary">暂无可用预设模板</Text>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalConfigPage;
