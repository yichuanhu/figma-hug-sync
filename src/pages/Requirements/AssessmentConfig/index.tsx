/**
 * 需求评估流配置 列表页（FEAT-017 STORY-021）
 *
 * 拆分自原「评审与评估流程配置」。专注评估流模板：
 *   - 多级串行评估阶段（priority / name / assessor_type / assessment_mode / assessor_ids）
 *   - 固定 2 个评估模型（价值评估 + 复杂度评估）
 *   - 维度可配（tier_select / numeric_input + weight）；按权重自动计算
 *   - 适用部门绑定
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  SideSheet,
  Form,
  Select,
  InputNumber,
  RadioGroup,
  Radio,
  TabPane,
  Tabs,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import {
  Ellipsis,
  CheckCircle,
  Trash2,
  Pencil,
  Plus,
  Pause,
  Eye,
  Copy,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import DepartmentPicker from '@/components/DepartmentPicker';
import {
  fetchAssessmentFlows,
  createAssessmentFlow,
  updateAssessmentFlow,
  deleteAssessmentFlow,
  activateAssessmentFlow,
  deactivateAssessmentFlow,
  cloneAssessmentFlow,
  subscribeAssessmentFlowChange,
  buildDefaultModels,
  newEmptyLevel,
  uid,
  type AssessmentFlowTemplate,
  type AssessmentLevel,
  type AssessmentModelConfig,
  type AssessmentDimension,
  type DimensionInputType,
  type ModelType,
} from './mockData';
import './index.less';

const { Title, Text } = Typography;

type DraftTemplate = Omit<AssessmentFlowTemplate, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

const emptyDraft = (): DraftTemplate => ({
  id: '',
  name: '',
  description: '',
  status: 'inactive',
  is_preset: false,
  is_draft: true,
  applicable_department_ids: [],
  levels: [newEmptyLevel(1)],
  models: buildDefaultModels(),
});

const sumWeights = (model: AssessmentModelConfig): number =>
  Number(model.dimensions.reduce((s, d) => s + (Number(d.weight) || 0), 0).toFixed(4));

const AssessmentConfigPage = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<AssessmentFlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<DraftTemplate>(emptyDraft());
  const [viewOnly, setViewOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeModelTab, setActiveModelTab] = useState<ModelType>('value');

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

  const presetTemplates = useMemo(() => list.filter((t) => t.is_preset), [list]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setViewOnly(false);
    setActiveModelTab('value');
    setEditorVisible(true);
  };

  const openEdit = (item: AssessmentFlowTemplate, readonly = false) => {
    setDraft(JSON.parse(JSON.stringify(item)));
    setViewOnly(readonly || !!item.is_preset);
    setActiveModelTab('value');
    setEditorVisible(true);
  };

  const handleClone = async (sourceId: string) => {
    try {
      const cloned = await cloneAssessmentFlow(sourceId);
      Toast.success('已复制为新模板');
      openEdit(cloned);
    } catch (e) {
      Toast.error((e as Error).message);
    }
  };

  const handleActivate = (item: AssessmentFlowTemplate) => {
    if (!item.applicable_department_ids?.length) {
      Toast.warning('请先在模板中选择「适用部门」');
      openEdit(item);
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

  // ===== 评估阶段编辑 =====
  const updateLevels = (levels: AssessmentLevel[]) => {
    const normalized = levels.map((l, i) => ({ ...l, priority: i + 1 }));
    setDraft((d) => ({ ...d, levels: normalized }));
  };
  const addLevel = () => updateLevels([...draft.levels, newEmptyLevel(draft.levels.length + 1)]);
  const removeLevel = (id: string) => updateLevels(draft.levels.filter((l) => l.id !== id));
  const moveLevel = (idx: number, dir: -1 | 1) => {
    const next = [...draft.levels];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateLevels(next);
  };
  const patchLevel = (id: string, patch: Partial<AssessmentLevel>) =>
    updateLevels(draft.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  // ===== 评估模型/维度编辑 =====
  const patchModel = (type: ModelType, patch: Partial<AssessmentModelConfig>) =>
    setDraft((d) => ({
      ...d,
      models: d.models.map((m) => (m.type === type ? { ...m, ...patch } : m)),
    }));

  const addDimension = (type: ModelType) => {
    const dim: AssessmentDimension = {
      id: uid('dim'),
      key: `dim_${Date.now().toString(36).slice(-4)}`,
      name: '新维度',
      input_type: 'tier_select',
      weight: 0,
      tiers: [
        { id: uid('t'), label: '高', score: 100 },
        { id: uid('t'), label: '中', score: 50 },
        { id: uid('t'), label: '低', score: 25 },
      ],
    };
    patchModel(type, {
      dimensions: [...(draft.models.find((m) => m.type === type)?.dimensions ?? []), dim],
    });
  };

  const removeDimension = (type: ModelType, id: string) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    patchModel(type, { dimensions: dims.filter((d) => d.id !== id) });
  };

  const patchDimension = (type: ModelType, id: string, patch: Partial<AssessmentDimension>) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    patchModel(type, { dimensions: dims.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  const changeDimInputType = (type: ModelType, id: string, inputType: DimensionInputType) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    const dim = dims.find((d) => d.id === id);
    if (!dim) return;
    const baseTier =
      inputType === 'tier_select'
        ? [
            { id: uid('t'), label: '高', score: 100 },
            { id: uid('t'), label: '中', score: 50 },
            { id: uid('t'), label: '低', score: 25 },
          ]
        : [
            { id: uid('t'), label: '高区间', min_value: 50, max_value: null, score: 100 },
            { id: uid('t'), label: '中区间', min_value: 10, max_value: 50, score: 50 },
            { id: uid('t'), label: '低区间', min_value: 0, max_value: 10, score: 25 },
          ];
    patchDimension(type, id, {
      input_type: inputType,
      unit: inputType === 'numeric_input' ? dim.unit || '' : undefined,
      tiers: baseTier,
    });
  };

  const patchTier = (type: ModelType, dimId: string, tierId: string, patch: Record<string, unknown>) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    const next = dims.map((d) =>
      d.id === dimId ? { ...d, tiers: d.tiers.map((tr) => (tr.id === tierId ? { ...tr, ...patch } : tr)) } : d,
    );
    patchModel(type, { dimensions: next });
  };

  const addTier = (type: ModelType, dimId: string) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    const dim = dims.find((d) => d.id === dimId);
    if (!dim) return;
    const tier =
      dim.input_type === 'tier_select'
        ? { id: uid('t'), label: '新档位', score: 0 }
        : { id: uid('t'), label: '新区间', min_value: 0, max_value: null, score: 0 };
    patchDimension(type, dimId, { tiers: [...dim.tiers, tier] });
  };

  const removeTier = (type: ModelType, dimId: string, tierId: string) => {
    const dims = draft.models.find((m) => m.type === type)?.dimensions ?? [];
    const dim = dims.find((d) => d.id === dimId);
    if (!dim) return;
    patchDimension(type, dimId, { tiers: dim.tiers.filter((tr) => tr.id !== tierId) });
  };

  // ===== 保存 =====
  const validate = (): string | null => {
    if (!draft.name.trim()) return '请输入模板名称';
    if (!draft.levels.length) return '至少配置一个评估阶段';
    for (const lv of draft.levels) {
      if (!lv.name.trim()) return '评估阶段名称不能为空';
      if (lv.assessor_type === 'specific_users' && !lv.assessor_ids.length) return '指定评估人不能为空';
    }
    for (const model of draft.models) {
      if (!model.dimensions.length) return `「${model.name}」至少需要 1 个维度`;
      const wsum = sumWeights(model);
      if (Math.abs(wsum - 1) > 0.01) return `「${model.name}」维度权重之和需为 1，当前为 ${wsum}`;
      for (const d of model.dimensions) {
        if (!d.name.trim() || !d.key.trim()) return `「${model.name}」存在未填写的维度名称或 key`;
        if (d.input_type === 'numeric_input' && !d.unit?.trim()) return `「${d.name}」需填写数值单位`;
        if (!d.tiers.length) return `「${d.name}」至少配置 1 个档位`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Toast.warning(err); return; }
    setSubmitting(true);
    try {
      if (draft.id) {
        await updateAssessmentFlow(draft.id, {
          name: draft.name,
          description: draft.description,
          applicable_department_ids: draft.applicable_department_ids,
          levels: draft.levels,
          models: draft.models,
        });
        Toast.success('已保存');
      } else {
        await createAssessmentFlow({
          name: draft.name,
          description: draft.description,
          applicable_department_ids: draft.applicable_department_ids,
          levels: draft.levels,
          models: draft.models,
        });
        Toast.success('已创建');
      }
      setEditorVisible(false);
      load();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 渲染 =====
  const renderLevelRow = (lv: AssessmentLevel, idx: number) => (
    <div className="assessment-flow-builder-level-row" key={lv.id}>
      <div className="assessment-flow-builder-level-row-header">
        <Tag color="blue" type="light" size="small">L{lv.priority}</Tag>
        <Input
          value={lv.name}
          onChange={(v) => patchLevel(lv.id, { name: v })}
          disabled={viewOnly}
          placeholder="阶段名称"
          style={{ flex: 1 }}
          maxLength={50}
        />
        {!viewOnly && (
          <Space spacing={4}>
            <Button
              theme="borderless"
              size="small"
              icon={<ArrowUp size={14} strokeWidth={2} />}
              disabled={idx === 0}
              onClick={() => moveLevel(idx, -1)}
            />
            <Button
              theme="borderless"
              size="small"
              icon={<ArrowDown size={14} strokeWidth={2} />}
              disabled={idx === draft.levels.length - 1}
              onClick={() => moveLevel(idx, 1)}
            />
            <Button
              theme="borderless"
              type="danger"
              size="small"
              icon={<X size={14} strokeWidth={2} />}
              disabled={draft.levels.length === 1}
              onClick={() => removeLevel(lv.id)}
            />
          </Space>
        )}
      </div>
      <div className="assessment-flow-builder-level-row-grid">
        <div>
          <Text size="small" type="tertiary" style={{ display: 'block', marginBottom: 4 }}>评估人类型</Text>
          <Select
            value={lv.assessor_type}
            disabled={viewOnly}
            style={{ width: '100%' }}
            onChange={(v) => patchLevel(lv.id, { assessor_type: v as AssessmentLevel['assessor_type'], assessor_ids: [] })}
            optionList={[
              { value: 'department_leader', label: '部门负责人' },
              { value: 'specific_users', label: '指定用户' },
            ]}
          />
        </div>
        <div>
          <Text size="small" type="tertiary" style={{ display: 'block', marginBottom: 4 }}>通过条件</Text>
          <Select
            value={lv.assessment_mode}
            disabled={viewOnly}
            style={{ width: '100%' }}
            onChange={(v) => patchLevel(lv.id, { assessment_mode: v as AssessmentLevel['assessment_mode'] })}
            optionList={[
              { value: 'any_one', label: '任意通过' },
              { value: 'all', label: '全部通过' },
              { value: 'majority', label: '多数通过' },
            ]}
          />
        </div>
      </div>
      {lv.assessor_type === 'specific_users' && (
        <div className="assessment-flow-builder-level-row-extra">
          <Text size="small" type="tertiary" style={{ display: 'block', marginBottom: 4 }}>指定评估人</Text>
          <Select
            multiple
            value={lv.assessor_ids}
            disabled={viewOnly}
            style={{ width: '100%' }}
            placeholder="选择评估人"
            onChange={(v) => patchLevel(lv.id, { assessor_ids: v as string[] })}
            optionList={[
              { value: 'user-001', label: '张技术' },
              { value: 'user-002', label: '李架构' },
              { value: 'user-003', label: '王评审' },
              { value: 'user-004', label: '赵负责人' },
              { value: 'user-008', label: 'Angela Wu' },
            ]}
          />
        </div>
      )}
    </div>
  );

  const renderDimension = (type: ModelType, dim: AssessmentDimension) => {
    const tierSelect = dim.input_type === 'tier_select';
    return (
      <div className="assessment-flow-builder-dim" key={dim.id}>
        <div className="assessment-flow-builder-dim-header">
          <Tag color="cyan" type="light" size="small">维度</Tag>
          <Input
            value={dim.name}
            onChange={(v) => patchDimension(type, dim.id, { name: v })}
            placeholder="维度名称"
            disabled={viewOnly}
            style={{ flex: 1 }}
            maxLength={50}
          />
          {!viewOnly && (
            <Button
              theme="borderless"
              type="danger"
              size="small"
              icon={<Trash2 size={14} strokeWidth={2} />}
              onClick={() => removeDimension(type, dim.id)}
            />
          )}
        </div>
        <div className="assessment-flow-builder-dim-grid">
          <Input
            value={dim.key}
            onChange={(v) => patchDimension(type, dim.id, { key: v })}
            placeholder="key (英文)"
            disabled={viewOnly}
            maxLength={50}
          />
          <Select
            value={dim.input_type}
            disabled={viewOnly}
            style={{ width: '100%' }}
            onChange={(v) => changeDimInputType(type, dim.id, v as DimensionInputType)}
            optionList={[
              { value: 'tier_select', label: '档位选择' },
              { value: 'numeric_input', label: '数值输入' },
            ]}
          />
          <InputNumber
            value={dim.weight}
            min={0}
            max={1}
            step={0.05}
            precision={2}
            placeholder="权重"
            disabled={viewOnly}
            onChange={(v) => patchDimension(type, dim.id, { weight: Number(v) || 0 })}
            style={{ width: '100%' }}
            suffix="权重"
          />
        </div>
        {!tierSelect && (
          <Input
            value={dim.unit || ''}
            onChange={(v) => patchDimension(type, dim.id, { unit: v })}
            placeholder="数值单位（如 H/月）"
            disabled={viewOnly}
            style={{ marginBottom: 8 }}
            maxLength={20}
          />
        )}
        <div className="assessment-flow-builder-dim-tiers">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text size="small" type="tertiary">{tierSelect ? '档位列表' : '区间档位列表'}</Text>
            {!viewOnly && (
              <Button
                theme="borderless"
                size="small"
                icon={<Plus size={14} strokeWidth={2} />}
                onClick={() => addTier(type, dim.id)}
              >
                添加档位
              </Button>
            )}
          </div>
          {dim.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`assessment-flow-builder-dim-tier-row${tierSelect ? ' assessment-flow-builder-dim-tier-row-tier-select' : ''}`}
            >
              <Input
                value={tier.label}
                onChange={(v) => patchTier(type, dim.id, tier.id, { label: v })}
                disabled={viewOnly}
                placeholder="档位文字"
                maxLength={50}
              />
              {!tierSelect && (
                <>
                  <InputNumber
                    value={tier.min_value ?? undefined}
                    onChange={(v) => patchTier(type, dim.id, tier.id, { min_value: v === '' || v === undefined ? null : Number(v) })}
                    placeholder="≥ 下界"
                    disabled={viewOnly}
                    style={{ width: '100%' }}
                  />
                  <InputNumber
                    value={tier.max_value ?? undefined}
                    onChange={(v) => patchTier(type, dim.id, tier.id, { max_value: v === '' || v === undefined ? null : Number(v) })}
                    placeholder="< 上界"
                    disabled={viewOnly}
                    style={{ width: '100%' }}
                  />
                </>
              )}
              <InputNumber
                value={tier.score}
                min={0}
                step={5}
                onChange={(v) => patchTier(type, dim.id, tier.id, { score: Number(v) || 0 })}
                placeholder="分值"
                disabled={viewOnly}
                style={{ width: '100%' }}
              />
              {!viewOnly && (
                <Button
                  theme="borderless"
                  type="danger"
                  size="small"
                  icon={<X size={14} strokeWidth={2} />}
                  onClick={() => removeTier(type, dim.id, tier.id)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="assessment-config-page">
      <div className="assessment-config-page-header">
        <div className="assessment-config-page-header-title">
          <Title heading={3} className="title">评估流配置</Title>
          <Text type="tertiary">
            集中管理需求评估流模板。配置多级串行评估阶段与固定的「价值评估 / 复杂度评估」模型；通过模板中的「适用部门」决定哪些部门的需求需要走该评估流程。
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
              <Tooltip content={presetTemplates.length === 0 ? '暂无可用预设模板' : ''} position="bottom">
                <span style={{ display: 'inline-block' }}>
                  <Button
                    icon={<Copy size={16} strokeWidth={2} />}
                    disabled={presetTemplates.length === 0}
                    onClick={() => {
                      Modal.confirm({
                        title: '基于模板创建',
                        content: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {presetTemplates.map((p) => (
                              <div
                                key={p.id}
                                style={{ padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 6, cursor: 'pointer' }}
                                onClick={() => {
                                  Modal.destroyAll();
                                  handleClone(p.id);
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{p.name}</div>
                                <Text type="tertiary" size="small">{p.description || '暂无描述'}</Text>
                              </div>
                            ))}
                          </div>
                        ),
                        footer: null,
                      });
                    }}
                  >
                    基于模板创建
                  </Button>
                </span>
              </Tooltip>
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={openCreate}>
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
                  onClick={() => openEdit(item, !!item.is_preset)}
                >
                  <div className="assessment-flow-card-header">
                    <div className="assessment-flow-card-title-row">
                      <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 16 }}>{item.name}</Text>
                      {item.status === 'active' && !item.is_preset && (
                        <Tag color="green" type="solid" size="small">已激活</Tag>
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
                            <Dropdown.Item icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(item, true); }}>
                              {t('common.viewDetail')}
                            </Dropdown.Item>
                            <Dropdown.Item icon={<Copy size={14} />} onClick={(e) => { e.stopPropagation(); handleClone(item.id); }}>
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
                            <Dropdown.Item icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
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

      <SideSheet
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        width={900}
        mask={false}
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {draft.id ? (viewOnly ? '查看评估流模板' : '编辑评估流模板') : '新建评估流模板'}
            {viewOnly && <Tag color="blue" type="light" size="small">只读</Tag>}
          </span>
        }
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditorVisible(false)}>取消</Button>
            {!viewOnly && (
              <Button theme="solid" type="primary" loading={submitting} onClick={handleSave}>
                保存
              </Button>
            )}
          </Space>
        }
      >
        <div className="assessment-flow-builder">
          {/* 基本信息 */}
          <div className="assessment-flow-builder-section">
            <Text strong style={{ display: 'block', marginBottom: 12 }}>基本信息</Text>
            <Form labelPosition="top">
              <Form.Slot label="模板名称" required>
                <Input
                  value={draft.name}
                  onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                  disabled={viewOnly}
                  maxLength={50}
                  placeholder="如：研发部评估模板"
                />
              </Form.Slot>
              <Form.Slot label="描述">
                <Input
                  value={draft.description || ''}
                  onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
                  disabled={viewOnly}
                  maxLength={200}
                  placeholder="选填"
                />
              </Form.Slot>
              <Form.Slot label="适用部门">
                <DepartmentPicker
                  value={draft.applicable_department_ids}
                  onChange={(ids) => setDraft((d) => ({ ...d, applicable_department_ids: ids }))}
                  disabled={viewOnly}
                  placeholder="选择适用部门（激活时必填）"
                />
              </Form.Slot>
            </Form>
          </div>

          {/* 评估阶段 */}
          <div className="assessment-flow-builder-section">
            <div className="assessment-flow-builder-section-header">
              <Text strong>评估阶段（多级串行）</Text>
              {!viewOnly && (
                <Button size="small" icon={<Plus size={14} strokeWidth={2} />} onClick={addLevel}>
                  添加阶段
                </Button>
              )}
            </div>
            {draft.levels.map((lv, idx) => renderLevelRow(lv, idx))}
          </div>

          {/* 评估模型 */}
          <div className="assessment-flow-builder-section">
            <Text strong style={{ display: 'block', marginBottom: 12 }}>评估模型（固定 2 个）</Text>
            <Tabs activeKey={activeModelTab} onChange={(k) => setActiveModelTab(k as ModelType)} type="line">
              {draft.models.map((model) => {
                const ws = sumWeights(model);
                const wsOk = Math.abs(ws - 1) <= 0.01;
                return (
                  <TabPane
                    key={model.type}
                    itemKey={model.type}
                    tab={
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {model.name}
                        <Tag size="small" color={wsOk ? 'green' : 'orange'} type="light">
                          权重 {ws.toFixed(2)}
                        </Tag>
                      </span>
                    }
                  >
                    <div className="assessment-flow-builder-model" style={{ marginTop: 12 }}>
                      <div className="assessment-flow-builder-model-header">
                        <Input
                          value={model.name}
                          onChange={(v) => patchModel(model.type, { name: v })}
                          disabled={viewOnly}
                          maxLength={50}
                          style={{ width: 240 }}
                        />
                        {!viewOnly && (
                          <Button size="small" icon={<Plus size={14} strokeWidth={2} />} onClick={() => addDimension(model.type)}>
                            添加维度
                          </Button>
                        )}
                      </div>
                      <Input
                        value={model.description || ''}
                        onChange={(v) => patchModel(model.type, { description: v })}
                        disabled={viewOnly}
                        maxLength={200}
                        placeholder="模型说明（选填）"
                        style={{ marginBottom: 12 }}
                      />
                      {model.dimensions.map((dim) => renderDimension(model.type, dim))}
                      <Text type={wsOk ? 'tertiary' : 'warning'} className="assessment-flow-builder-weight-hint">
                        当前维度权重之和：{ws.toFixed(2)}（需为 1.00）
                      </Text>
                    </div>
                  </TabPane>
                );
              })}
            </Tabs>
          </div>
        </div>
      </SideSheet>
    </div>
  );
};

export default AssessmentConfigPage;
