/**
 * 需求评估流配置 列表页（FEAT-017 STORY-021）
 *
 * 拆分自原「评审与评估流程配置」。
 * 新建/编辑：跳转新页面 /requirements/assessment-config/builder/:id
 * 查看详情：DetailDrawerWrapper + 嵌入 Builder 只读
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';

import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Trash2, Pencil, Plus, Pause, Eye, Copy, Building2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import { getDepartmentName } from '@/mocks/departmentData';

import {
  fetchAssessmentFlows,
  deleteAssessmentFlow,
  activateAssessmentFlow,
  deactivateAssessmentFlow,
  subscribeAssessmentFlowChange,
  type AssessmentFlowTemplate,
} from './mockData';
import AssessmentFlowBuilder from './components/AssessmentFlowBuilder';
import './index.less';

const { Title, Text } = Typography;

const BASE_PATH = '/requirements/assessment-config';

const AssessmentConfigPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<AssessmentFlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setList(await fetchAssessmentFlows(keyword));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeAssessmentFlowChange(() => load(true)), [load]);

  const presetTemplates = useMemo(() => list.filter((x) => x.is_preset), [list]);
  const hasPresets = presetTemplates.length > 0;

  const goDetail = (f: AssessmentFlowTemplate) => setDetailId(f.id);
  const goEdit = (f: AssessmentFlowTemplate) => navigate(`${BASE_PATH}/builder/${f.id}`);
  const handleCreateNew = () => navigate(`${BASE_PATH}/builder/new`);
  const handleCloneFromPreset = (sourceId: string) => {
    setPresetPickerVisible(false);
    navigate(`${BASE_PATH}/builder/new?preset=${encodeURIComponent(sourceId)}`);
  };

  const handleActivate = (item: AssessmentFlowTemplate) => {
    if (!item.applicable_department_ids?.length) {
      Toast.warning('请先在模板中选择「适用部门」');
      goEdit(item);
      return;
    }
    Modal.confirm({
      title: '启用评估流模板',
      content: `确认启用「${item.name}」？启用后将对所选部门生效。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await activateAssessmentFlow(item.id);
          Toast.success('启用成功');
          load();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const handleDeactivate = async (item: AssessmentFlowTemplate) => {
    await deactivateAssessmentFlow(item.id);
    Toast.success('已停用');
    load();
  };

  const handleDelete = (item: AssessmentFlowTemplate) => {
    Modal.confirm({
      title: '删除评估流模板',
      content: `确认删除「${item.name}」？此操作不可恢复。`,
      okText: t('common.delete'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteAssessmentFlow(item.id);
          Toast.success(t('common.deleteSuccess'));
          load();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const current = detailId ? list.find((x) => x.id === detailId) ?? null : null;

  return (
    <div className="assessment-config-page">
      <div className="assessment-config-page-header">
        <div className="assessment-config-page-header-title">
          <Title heading={3} className="title">评估流配置</Title>
          <Text type="tertiary">
            集中管理需求评估流模板。配置多级串行评估阶段与「价值评估 / 复杂度评估」模型；通过模板中的「适用部门」决定哪些部门的需求需要走该评估流程。
          </Text>
        </div>
        <Row type="flex" justify="space-between" align="middle" className="assessment-config-page-header-toolbar">
          <Col>
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索名称 / 描述"
              className="assessment-config-page-search-input"
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
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={handleCreateNew}>
                新建评估流
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="assessment-config-page-content">
        {!loading && list.length === 0 ? (
          <EmptyState variant="noData" description="暂无评估流模板，点击右上角新建" />
        ) : (
          <div className="assessment-config-page-grid">
            {list.map((item) => {
              const dimCount = item.models.reduce((s, m) => s + m.dimensions.length, 0);
              return (
                <div
                  key={item.id}
                  className={`assessment-flow-card ${item.status === 'active' ? 'active' : ''}`}
                  onClick={() => goDetail(item)}
                >
                  <div className="assessment-flow-card-header">
                    <div className="assessment-flow-card-title-row">
                      <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 16 }}>{item.name}</Text>
                      {item.status === 'active' && !item.is_preset && (
                        <Tag color="green" type="solid" size="small">已启用</Tag>
                      )}
                      {item.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
                    </div>
                    <Dropdown
                      trigger="click"
                      clickToHide
                      position="bottomRight"
                      render={
                        item.is_preset ? (
                          <Dropdown.Menu>
                            <Dropdown.Item icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); goDetail(item); }}>
                              {t('common.viewDetail')}
                            </Dropdown.Item>
                            <Dropdown.Item icon={<Copy size={14} />} onClick={(e) => { e.stopPropagation(); handleCloneFromPreset(item.id); }}>
                              基于此模板创建
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        ) : (
                          <Dropdown.Menu>
                            {item.status !== 'active' ? (
                              <Dropdown.Item icon={<CheckCircle size={14} />} onClick={(e) => { e.stopPropagation(); handleActivate(item); }}>
                                启用
                              </Dropdown.Item>
                            ) : (
                              <Dropdown.Item icon={<Pause size={14} />} onClick={(e) => { e.stopPropagation(); handleDeactivate(item); }}>
                                停用
                              </Dropdown.Item>
                            )}
                            <Dropdown.Item icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(item); }}>
                              编辑
                            </Dropdown.Item>
                            <Dropdown.Item icon={<Trash2 size={14} />} type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                              {t('common.delete')}
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        )
                      }
                    >
                      <Button icon={<Ellipsis size={16} />} theme="borderless" size="small" onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                  </div>
                  <Text type="secondary" size="small" ellipsis={{ rows: 2 }} className="assessment-flow-card-desc">
                    {item.description || '暂无描述'}
                  </Text>
                  <div className="assessment-flow-card-footer">
                    <Tag size="small" color="grey" type="light">{item.levels.length} 级评估</Tag>
                    <Tag size="small" color="grey" type="light">{dimCount} 个维度</Tag>
                    <Tag size="small" color="grey" type="light">
                      {item.applicable_department_ids?.length
                        ? `${item.applicable_department_ids.length} 个部门`
                        : '未绑定部门'}
                    </Tag>
                    {item.is_preset && <Tag size="small" color="grey" type="light">只读</Tag>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 详情抽屉 —— 只读；编辑/启用通过抽屉顶部操作转到独立页面或调用启用 */}
      {(() => {
        const extraActions = current ? (
          <Space spacing={4}>
            {current.is_preset ? (
              <Tooltip content="基于此模板创建" position="bottom">
                <Button
                  icon={<Copy size={16} strokeWidth={2} />}
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  onClick={() => handleCloneFromPreset(current.id)}
                />
              </Tooltip>
            ) : (
              <>
                <Tooltip content={t('common.edit')} position="bottom">
                  <Button
                    icon={<Pencil size={16} strokeWidth={2} />}
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    onClick={() => {
                      setDetailId(null);
                      navigate(`${BASE_PATH}/builder/${current.id}`);
                    }}
                  />
                </Tooltip>
                {current.status !== 'active' && (
                  <Tooltip content="启用" position="bottom">
                    <Button
                      icon={<CheckCircle size={16} strokeWidth={2} />}
                      theme="borderless"
                      type="tertiary"
                      size="small"
                      onClick={() => handleActivate(current)}
                    />
                  </Tooltip>
                )}
              </>
            )}
          </Space>
        ) : null;
        const deleteAction = current && !current.is_preset ? (
          <Button
            icon={<Trash2 size={16} strokeWidth={2} />}
            theme="borderless"
            type="danger"
            size="small"
            onClick={() => {
              setDetailId(null);
              handleDelete(current);
            }}
          />
        ) : null;

        return (
          <DetailDrawerWrapper
            visible={!!detailId}
            onClose={() => { setDetailId(null); load(true); }}
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {current?.name}
                {current?.status === 'active' && !current?.is_preset && (
                  <Tag color="green" type="solid" size="small">已启用</Tag>
                )}
                {current?.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
              </span>
            }
            defaultWidth={900}
            minWidth={720}
            storageKey="assessmentFlowDetailDrawerWidth"
            dataList={list}
            currentId={detailId ?? undefined}
            onNavigate={(s) => setDetailId(s.id)}
            extraActions={extraActions}
            deleteAction={deleteAction}
            className="assessment-flow-detail-drawer"
          >
            {detailId && current && (
              <Tabs type="line" className="assessment-flow-detail-drawer-tabs" style={{ height: '100%' }}>
                <TabPane tab="基本信息" itemKey="basic">
                  <div className="assessment-flow-detail-drawer-content">
                    <div className="assessment-flow-detail-drawer-meta-grid">
                      <Text className="label">名称</Text>
                      <Text>{current.name}</Text>
                      <Text className="label">状态</Text>
                      <Text>
                        {current.is_preset
                          ? '预设模板（不可启用）'
                          : current.status === 'active'
                          ? '已启用'
                          : '未启用'}
                      </Text>
                      <Text className="label">描述</Text>
                      <Text>{current.description || '-'}</Text>
                      <Text className="label">适用部门</Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(current.applicable_department_ids ?? []).length === 0 ? (
                          <Text type="tertiary">尚未配置适用部门</Text>
                        ) : (
                          current.applicable_department_ids.map((id) => (
                            <Tag
                              key={id}
                              color="violet"
                              type="light"
                              size="small"
                              prefixIcon={<Building2 size={12} strokeWidth={2} />}
                            >
                              {getDepartmentName(id)}
                            </Tag>
                          ))
                        )}
                      </div>
                      <Text className="label">评估级数</Text>
                      <Text>{current.levels.length} 级</Text>
                      <Text className="label">评估维度</Text>
                      <Text>{current.models.reduce((s, m) => s + m.dimensions.length, 0)} 个</Text>
                      <Text className="label">{t('common.createdAt')}</Text>
                      <Text>{new Date(current.created_at).toLocaleString('zh-CN', { hour12: false })}</Text>
                      <Text className="label">{t('common.updatedAt') || '更新时间'}</Text>
                      <Text>{new Date(current.updated_at).toLocaleString('zh-CN', { hour12: false })}</Text>
                    </div>
                  </div>
                </TabPane>
                <TabPane tab={`评估流配置 (${current.levels.length})`} itemKey="flow">
                  <AssessmentFlowBuilder
                    key={detailId}
                    embedded
                    embeddedId={detailId}
                    embeddedView
                    hideHeader
                    onEmbeddedClose={() => { setDetailId(null); load(true); }}
                    onEmbeddedSwitchEdit={(id) => { setDetailId(null); navigate(`${BASE_PATH}/builder/${id}`); }}
                    onEmbeddedNavigate={(id) => setDetailId(id)}
                  />
                </TabPane>
              </Tabs>
            )}

          </DetailDrawerWrapper>
        );
      })()}

      {/* 基于预设模板创建 */}
      <Modal
        title="基于模板创建"
        visible={presetPickerVisible}
        onCancel={() => setPresetPickerVisible(false)}
        footer={null}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
          {presetTemplates.map((f) => (
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
              <Text size="small" type="secondary">{f.description || '暂无描述'}</Text>
            </div>
          ))}
          {presetTemplates.length === 0 && <Text type="tertiary">暂无可用预设模板</Text>}
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentConfigPage;
