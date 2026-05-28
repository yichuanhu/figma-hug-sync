/**
 * 评估流配置 Builder：新建/编辑/查看（FEAT-017 STORY-021）
 *
 * 复用模式参考 ApprovalFlowBuilder：
 *   - 路由模式：/requirements/assessment-config/builder/:id 或 /detail/:id
 *   - 嵌入模式：在 DetailDrawerWrapper 内复用，hideHeader + embedded
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Input,
  InputNumber,
  Select,
  Toast,
  Modal,
  Space,
  Tag,
  Spin,
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  Pencil,
  Building2,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Gauge,
} from 'lucide-react';
import DepartmentPicker from '@/components/DepartmentPicker';
import {
  fetchAssessmentFlows,
  getAssessmentFlowById,
  createAssessmentFlow,
  updateAssessmentFlow,
  activateAssessmentFlow,
  buildDefaultModels,
  newEmptyLevel,
  uid,
  type AssessmentFlowTemplate,
  type AssessmentLevel,
  type AssessmentModelConfig,
  type AssessmentDimension,
  type DimensionInputType,
  type ModelType,
} from '../../mockData';
import './index.less';

const { Title, Text } = Typography;

interface Props {
  /** 嵌入模式（用于详情抽屉复用） */
  embedded?: boolean;
  embeddedId?: string;
  embeddedView?: boolean;
  onEmbeddedClose?: () => void;
  onEmbeddedSwitchEdit?: (id: string) => void;
  onEmbeddedNavigate?: (id: string) => void;
  hideHeader?: boolean;
}

const BASE_PATH = '/requirements/assessment-config';

const sumWeights = (model: AssessmentModelConfig): number =>
  Number(model.dimensions.reduce((s, d) => s + (Number(d.weight) || 0), 0).toFixed(4));

const emptyDraft = (): AssessmentFlowTemplate => ({
  id: 'new',
  name: '未命名评估流',
  description: '',
  status: 'inactive',
  is_preset: false,
  is_draft: true,
  applicable_department_ids: [],
  levels: [newEmptyLevel(1)],
  models: buildDefaultModels(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const AssessmentFlowBuilderPage = ({
  embedded = false,
  embeddedId,
  embeddedView,
  onEmbeddedClose,
  onEmbeddedSwitchEdit,
  onEmbeddedNavigate,
  hideHeader = false,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const id = embedded ? embeddedId : params.id;
  const isView = embedded ? !!embeddedView : location.pathname.includes('/detail/');
  const isNew = id === 'new';

  const [draft, setDraft] = useState<AssessmentFlowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [activeModelTab, setActiveModelTab] = useState<ModelType>('value');
  const [fullscreen, setFullscreen] = useState(false);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [presetIds, setPresetIds] = useState<string[]>([]);

  // 加载列表用于上一/下一切换
  useEffect(() => {
    fetchAssessmentFlows().then((all) => {
      setAllIds(all.map((x) => x.id));
      setPresetIds(all.filter((x) => x.is_preset).map((x) => x.id));
    });
  }, []);

  // 加载草稿
  useEffect(() => {
    if (isNew) {
      const presetId = new URLSearchParams(location.search).get('preset');
      const preset = presetId ? getAssessmentFlowById(presetId) : null;
      if (preset) {
        setDraft({
          ...JSON.parse(JSON.stringify(preset)) as AssessmentFlowTemplate,
          id: 'new',
          name: `${preset.name} 副本`,
          status: 'inactive',
          is_preset: false,
          is_draft: true,
          applicable_department_ids: [],
        });
      } else {
        setDraft(emptyDraft());
      }
      setDirty(true);
      setLoading(false);
      return;
    }
    if (!id) return;
    const f = getAssessmentFlowById(id);
    if (!f) {
      Toast.error('模板不存在');
      if (embedded) onEmbeddedClose?.();
      else navigate(BASE_PATH);
      return;
    }
    setDraft(JSON.parse(JSON.stringify(f)) as AssessmentFlowTemplate);
    setDirty(false);
    setLoading(false);
  }, [id, isNew, navigate, embedded, onEmbeddedClose, location.search]);

  const patch = (p: Partial<AssessmentFlowTemplate>) => {
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  const updateLevels = (levels: AssessmentLevel[]) => {
    const normalized = levels.map((l, i) => ({ ...l, priority: i + 1 }));
    patch({ levels: normalized });
  };
  const addLevel = () => draft && updateLevels([...draft.levels, newEmptyLevel(draft.levels.length + 1)]);
  const removeLevel = (lid: string) => draft && updateLevels(draft.levels.filter((l) => l.id !== lid));
  const moveLevel = (idx: number, dir: -1 | 1) => {
    if (!draft) return;
    const next = [...draft.levels];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateLevels(next);
  };
  const patchLevel = (lid: string, p: Partial<AssessmentLevel>) =>
    draft && updateLevels(draft.levels.map((l) => (l.id === lid ? { ...l, ...p } : l)));

  const patchModel = (type: ModelType, p: Partial<AssessmentModelConfig>) =>
    patch({ models: draft!.models.map((m) => (m.type === type ? { ...m, ...p } : m)) });

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
      dimensions: [...(draft!.models.find((m) => m.type === type)?.dimensions ?? []), dim],
    });
  };
  const removeDimension = (type: ModelType, did: string) => {
    const dims = draft!.models.find((m) => m.type === type)?.dimensions ?? [];
    patchModel(type, { dimensions: dims.filter((d) => d.id !== did) });
  };
  const patchDimension = (type: ModelType, did: string, p: Partial<AssessmentDimension>) => {
    const dims = draft!.models.find((m) => m.type === type)?.dimensions ?? [];
    patchModel(type, { dimensions: dims.map((d) => (d.id === did ? { ...d, ...p } : d)) });
  };
  const changeDimInputType = (type: ModelType, did: string, it: DimensionInputType) => {
    const dim = draft!.models.find((m) => m.type === type)?.dimensions.find((d) => d.id === did);
    if (!dim) return;
    const baseTier =
      it === 'tier_select'
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
    patchDimension(type, did, {
      input_type: it,
      unit: it === 'numeric_input' ? dim.unit || '' : undefined,
      tiers: baseTier,
    });
  };
  const patchTier = (type: ModelType, did: string, tid: string, p: Record<string, unknown>) => {
    const dims = draft!.models.find((m) => m.type === type)?.dimensions ?? [];
    patchModel(type, {
      dimensions: dims.map((d) =>
        d.id === did ? { ...d, tiers: d.tiers.map((tr) => (tr.id === tid ? { ...tr, ...p } : tr)) } : d,
      ),
    });
  };
  const addTier = (type: ModelType, did: string) => {
    const dim = draft!.models.find((m) => m.type === type)?.dimensions.find((d) => d.id === did);
    if (!dim) return;
    const tier =
      dim.input_type === 'tier_select'
        ? { id: uid('t'), label: '新档位', score: 0 }
        : { id: uid('t'), label: '新区间', min_value: 0, max_value: null, score: 0 };
    patchDimension(type, did, { tiers: [...dim.tiers, tier] });
  };
  const removeTier = (type: ModelType, did: string, tid: string) => {
    const dim = draft!.models.find((m) => m.type === type)?.dimensions.find((d) => d.id === did);
    if (!dim) return;
    patchDimension(type, did, { tiers: dim.tiers.filter((tr) => tr.id !== tid) });
  };

  const validate = (): string | null => {
    if (!draft) return '加载中';
    if (!draft.name.trim()) return '请输入模板名称';
    if (!draft.levels.length) return '至少配置一个评估阶段';
    for (const lv of draft.levels) {
      if (!lv.name.trim()) return '评估阶段名称不能为空';
      if (lv.assessor_type === 'specific_users' && !lv.assessor_ids.length) return '指定评估人不能为空';
    }
    for (const m of draft.models) {
      if (!m.dimensions.length) return `「${m.name}」至少需要 1 个维度`;
      const ws = sumWeights(m);
      if (Math.abs(ws - 1) > 0.01) return `「${m.name}」维度权重之和需为 1，当前为 ${ws}`;
      for (const d of m.dimensions) {
        if (!d.name.trim() || !d.key.trim()) return `「${m.name}」存在未填写的维度名称或 key`;
        if (d.input_type === 'numeric_input' && !d.unit?.trim()) return `「${d.name}」需填写数值单位`;
        if (!d.tiers.length) return `「${d.name}」至少配置 1 个档位`;
      }
    }
    return null;
  };

  const handleSave = async (): Promise<AssessmentFlowTemplate | null> => {
    const err = validate();
    if (err) { Toast.warning(err); return null; }
    try {
      let saved: AssessmentFlowTemplate;
      if (isNew) {
        saved = await createAssessmentFlow({
          name: draft!.name,
          description: draft!.description,
          applicable_department_ids: draft!.applicable_department_ids,
          levels: draft!.levels,
          models: draft!.models,
        });
      } else {
        saved = await updateAssessmentFlow(draft!.id, {
          name: draft!.name,
          description: draft!.description,
          applicable_department_ids: draft!.applicable_department_ids,
          levels: draft!.levels,
          models: draft!.models,
        });
      }
      setDraft(saved);
      setDirty(false);
      Toast.success('已保存');
      if (isNew && !embedded) navigate(`${BASE_PATH}/builder/${saved.id}`, { replace: true });
      return saved;
    } catch (e) {
      Toast.error((e as Error).message);
      return null;
    }
  };

  const handleActivate = async () => {
    if (!draft) return;
    if (dirty) { Toast.warning('请先保存当前修改后再启用'); return; }
    if (!draft.applicable_department_ids?.length) { Toast.warning('请先选择「适用部门」'); return; }
    Modal.confirm({
      title: '启用评估流模板',
      content: `确认启用「${draft.name}」？启用后将对所选部门生效。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateAssessmentFlow(draft.id);
        Toast.success('启用成功');
        if (embedded) onEmbeddedClose?.();
        else navigate(BASE_PATH);
      },
    });
  };

  const guardedClose = () => {
    const doClose = () => (embedded ? onEmbeddedClose?.() : navigate(BASE_PATH));
    if (!dirty) { doClose(); return; }
    Modal.confirm({
      title: '离开当前页？',
      content: '当前已有未保存的修改，离开后修改将丢失。',
      okText: '离开',
      cancelText: '继续编辑',
      okButtonProps: { type: 'danger' },
      onOk: doClose,
    });
  };

  const goPrev = useMemo(() => {
    if (!draft) return null;
    const pool = draft.is_preset ? presetIds : allIds;
    const idx = pool.indexOf(draft.id);
    return idx > 0 ? pool[idx - 1] : null;
  }, [draft, allIds, presetIds]);
  const goNext = useMemo(() => {
    if (!draft) return null;
    const pool = draft.is_preset ? presetIds : allIds;
    const idx = pool.indexOf(draft.id);
    return idx >= 0 && idx < pool.length - 1 ? pool[idx + 1] : null;
  }, [draft, allIds, presetIds]);

  if (loading || !draft) {
    return <div className="assessment-flow-builder-page-loading"><Spin size="large" /></div>;
  }

  // ===== 渲染各模块 =====
  const renderDeptCard = () => {
    const deptCount = (draft.applicable_department_ids ?? []).length;
    return (
      <div className="assessment-flow-section-card">
        <div className="assessment-flow-section-card-header">
          <div className="assessment-flow-section-card-title">
            <Building2 size={16} strokeWidth={2} />
            <span>适用部门</span>
            {!isView && (
              <>
                <Text type="danger" size="small" style={{ marginLeft: 2 }}>*</Text>
                <Text type="tertiary" size="small" style={{ marginLeft: 4, fontWeight: 400 }}>
                  （启用时必填，草稿可留空）
                </Text>
              </>
            )}
          </div>
          <Text type="tertiary" size="small">
            通过部门绑定，决定哪些部门的需求需要走该评估流程。
          </Text>
        </div>
        <div className="assessment-flow-section-card-body">
          {isView ? (
            deptCount > 0 ? (
              <Space wrap>
                {draft.applicable_department_ids.map((d) => (
                  <Tag key={d} color="violet" type="light" size="large" prefixIcon={<Building2 size={12} strokeWidth={2} />}>
                    {d}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="tertiary">尚未配置适用部门</Text>
            )
          ) : (
            <DepartmentPicker
              value={draft.applicable_department_ids ?? []}
              onChange={(ids) => patch({ applicable_department_ids: ids })}
              placeholder="请选择适用部门（可多选）"
              maxTagCount={6}
            />
          )}
        </div>
      </div>
    );
  };

  const renderLevelsCard = () => (
    <div className="assessment-flow-section-card">
      <div className="assessment-flow-section-card-header">
        <div className="assessment-flow-section-card-toolbar">
          <div className="assessment-flow-section-card-title">
            <Layers size={16} strokeWidth={2} />
            <span>评估阶段（多级串行）</span>
          </div>
          {!isView && (
            <Button size="small" icon={<Plus size={14} strokeWidth={2} />} onClick={addLevel}>添加阶段</Button>
          )}
        </div>
        <Text type="tertiary" size="small">每个阶段顺序执行，需通过当前阶段才能进入下一阶段。</Text>
      </div>
      <div className="assessment-flow-section-card-body">
        {draft.levels.map((lv, idx) => (
          <div className="assessment-flow-builder-level-row" key={lv.id}>
            <div className="assessment-flow-builder-level-row-header">
              <Tag color="blue" type="light" size="small">L{lv.priority}</Tag>
              <Input
                value={lv.name}
                onChange={(v) => patchLevel(lv.id, { name: v })}
                disabled={isView}
                placeholder="阶段名称"
                style={{ flex: 1 }}
                maxLength={50}
              />
              {!isView && (
                <Space spacing={4}>
                  <Button theme="borderless" size="small" icon={<ArrowUp size={14} strokeWidth={2} />} disabled={idx === 0} onClick={() => moveLevel(idx, -1)} />
                  <Button theme="borderless" size="small" icon={<ArrowDown size={14} strokeWidth={2} />} disabled={idx === draft.levels.length - 1} onClick={() => moveLevel(idx, 1)} />
                  <Button theme="borderless" type="danger" size="small" icon={<X size={14} strokeWidth={2} />} disabled={draft.levels.length === 1} onClick={() => removeLevel(lv.id)} />
                </Space>
              )}
            </div>
            <div className="assessment-flow-builder-level-row-grid">
              <div>
                <Text size="small" type="tertiary" style={{ display: 'block', marginBottom: 4 }}>评估人类型</Text>
                <Select
                  value={lv.assessor_type}
                  disabled={isView}
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
                  disabled={isView}
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
                  disabled={isView}
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
        ))}
      </div>
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
            disabled={isView}
            style={{ flex: 1 }}
            maxLength={50}
          />
          {!isView && (
            <Button theme="borderless" type="danger" size="small" icon={<Trash2 size={14} strokeWidth={2} />} onClick={() => removeDimension(type, dim.id)} />
          )}
        </div>
        <div className="assessment-flow-builder-dim-grid">
          <Input value={dim.key} onChange={(v) => patchDimension(type, dim.id, { key: v })} placeholder="key (英文)" disabled={isView} maxLength={50} />
          <Select
            value={dim.input_type}
            disabled={isView}
            style={{ width: '100%' }}
            onChange={(v) => changeDimInputType(type, dim.id, v as DimensionInputType)}
            optionList={[
              { value: 'tier_select', label: '档位选择' },
              { value: 'numeric_input', label: '数值输入' },
            ]}
          />
          <InputNumber value={dim.weight} min={0} max={1} step={0.05} precision={2} placeholder="权重" disabled={isView} onChange={(v) => patchDimension(type, dim.id, { weight: Number(v) || 0 })} style={{ width: '100%' }} suffix="权重" />
        </div>
        {!tierSelect && (
          <Input value={dim.unit || ''} onChange={(v) => patchDimension(type, dim.id, { unit: v })} placeholder="数值单位（如 H/月）" disabled={isView} style={{ marginBottom: 8 }} maxLength={20} />
        )}
        <div className="assessment-flow-builder-dim-tiers">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text size="small" type="tertiary">{tierSelect ? '档位列表' : '区间档位列表'}</Text>
            {!isView && (
              <Button theme="borderless" size="small" icon={<Plus size={14} strokeWidth={2} />} onClick={() => addTier(type, dim.id)}>添加档位</Button>
            )}
          </div>
          {dim.tiers.map((tier) => (
            <div key={tier.id} className={`assessment-flow-builder-dim-tier-row${tierSelect ? ' assessment-flow-builder-dim-tier-row-tier-select' : ''}`}>
              <Input value={tier.label} onChange={(v) => patchTier(type, dim.id, tier.id, { label: v })} disabled={isView} placeholder="档位文字" maxLength={50} />
              {!tierSelect && (
                <>
                  <InputNumber value={tier.min_value ?? undefined} onChange={(v) => patchTier(type, dim.id, tier.id, { min_value: v === '' || v === undefined ? null : Number(v) })} placeholder="≥ 下界" disabled={isView} style={{ width: '100%' }} />
                  <InputNumber value={tier.max_value ?? undefined} onChange={(v) => patchTier(type, dim.id, tier.id, { max_value: v === '' || v === undefined ? null : Number(v) })} placeholder="< 上界" disabled={isView} style={{ width: '100%' }} />
                </>
              )}
              <InputNumber value={tier.score} min={0} step={5} onChange={(v) => patchTier(type, dim.id, tier.id, { score: Number(v) || 0 })} placeholder="分值" disabled={isView} style={{ width: '100%' }} />
              {!isView && (
                <Button theme="borderless" type="danger" size="small" icon={<X size={14} strokeWidth={2} />} onClick={() => removeTier(type, dim.id, tier.id)} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModelsCard = () => (
    <div className="assessment-flow-section-card">
      <div className="assessment-flow-section-card-header">
        <div className="assessment-flow-section-card-title">
          <Gauge size={16} strokeWidth={2} />
          <span>评估模型</span>
        </div>
        <Text type="tertiary" size="small">固定两个评估模型：价值评估 + 复杂度评估，每个模型按权重汇总得分。</Text>
      </div>
      <div className="assessment-flow-section-card-body">
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
                    <Tag size="small" color={wsOk ? 'green' : 'orange'} type="light">权重 {ws.toFixed(2)}</Tag>
                  </span>
                }
              >
                <div className="assessment-flow-builder-model" style={{ marginTop: 12 }}>
                  <div className="assessment-flow-builder-model-header">
                    <Input value={model.name} onChange={(v) => patchModel(model.type, { name: v })} disabled={isView} maxLength={50} style={{ width: 240 }} />
                    {!isView && (
                      <Button size="small" icon={<Plus size={14} strokeWidth={2} />} onClick={() => addDimension(model.type)}>添加维度</Button>
                    )}
                  </div>
                  <Input value={model.description || ''} onChange={(v) => patchModel(model.type, { description: v })} disabled={isView} maxLength={200} placeholder="模型说明（选填）" style={{ marginBottom: 12 }} />
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
  );

  return (
    <div className={`assessment-flow-builder-page${fullscreen ? ' assessment-flow-builder-page--fullscreen' : ''}${hideHeader ? ' assessment-flow-builder-page--embedded' : ''}`}>
      {!hideHeader && (
        <div className="assessment-flow-builder-page-header">
          <div className="assessment-flow-builder-page-header-left">
            <Tooltip content={t('common.back')} position="bottom">
              <Button icon={<ChevronLeft size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={guardedClose} />
            </Tooltip>
            <div className="assessment-flow-builder-page-title-block">
              <div className="assessment-flow-builder-page-title-row">
                {!isView && editingName ? (
                  <Input
                    autoFocus
                    value={nameDraft}
                    onChange={setNameDraft}
                    onBlur={() => {
                      const v = (nameDraft || '').trim();
                      if (v && v !== draft.name) patch({ name: v });
                      setEditingName(false);
                    }}
                    onEnterPress={() => {
                      const v = (nameDraft || '').trim();
                      if (v && v !== draft.name) patch({ name: v });
                      setEditingName(false);
                    }}
                    maxLength={50}
                    style={{ width: 240, fontSize: 18, fontWeight: 600 }}
                  />
                ) : (
                  <Title
                    heading={3}
                    style={{ cursor: isView ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}
                    onClick={() => {
                      if (isView) return;
                      setNameDraft(draft.name);
                      setEditingName(true);
                    }}
                  >
                    {draft.name}
                    {!isView && <Pencil size={14} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />}
                  </Title>
                )}
                {draft.status === 'active' && !draft.is_preset && <Tag color="green" type="light" size="small">已启用</Tag>}
                {draft.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
                {dirty && <Tag color="red" type="light" size="small">未保存</Tag>}
              </div>
              {isView ? (
                <Text type="tertiary" size="small" style={{ marginTop: 4 }}>
                  {draft.description || '暂无描述'}
                </Text>
              ) : (
                <Input
                  value={draft.description ?? ''}
                  onChange={(v) => patch({ description: v })}
                  placeholder="添加描述..."
                  maxLength={120}
                  size="small"
                  className="assessment-flow-builder-page-description-input"
                />
              )}
            </div>
          </div>
          <Space>
            {isView ? (
              <>
                {!draft.is_preset && (
                  <>
                    <Tooltip content={t('common.edit')} position="bottom">
                      <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={() => embedded ? onEmbeddedSwitchEdit?.(draft.id) : navigate(`${BASE_PATH}/builder/${draft.id}`)} />
                    </Tooltip>
                    {draft.status !== 'active' && (
                      <Tooltip content="启用" position="bottom">
                        <Button icon={<CheckCircle size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={handleActivate} />
                      </Tooltip>
                    )}
                    <div style={{ width: 1, height: 16, background: 'var(--semi-color-border)', margin: '0 4px' }} />
                  </>
                )}
                <Tooltip content="上一个" position="bottom">
                  <Button icon={<ChevronLeft size={16} strokeWidth={2} />} theme="borderless" type="tertiary" disabled={!goPrev} onClick={() => goPrev && (embedded ? onEmbeddedNavigate?.(goPrev) : navigate(`${BASE_PATH}/detail/${goPrev}`))} />
                </Tooltip>
                <Tooltip content="下一个" position="bottom">
                  <Button icon={<ChevronRight size={16} strokeWidth={2} />} theme="borderless" type="tertiary" disabled={!goNext} onClick={() => goNext && (embedded ? onEmbeddedNavigate?.(goNext) : navigate(`${BASE_PATH}/detail/${goNext}`))} />
                </Tooltip>
                <div style={{ width: 1, height: 16, background: 'var(--semi-color-border)', margin: '0 4px' }} />
                <Tooltip content={fullscreen ? '退出全屏' : '全屏'} position="bottom">
                  <Button icon={fullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={() => setFullscreen((v) => !v)} />
                </Tooltip>
                <Tooltip content="关闭" position="bottom">
                  <Button icon={<X size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={() => embedded ? onEmbeddedClose?.() : navigate(BASE_PATH)} />
                </Tooltip>
              </>
            ) : (
              <>
                <Button icon={<Save size={16} strokeWidth={2} />} theme={dirty ? 'solid' : 'light'} type={dirty ? 'primary' : 'tertiary'} onClick={handleSave} disabled={!dirty}>保存</Button>
                <Button icon={<CheckCircle size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={handleActivate} disabled={draft.status === 'active'}>启用</Button>
              </>
            )}
          </Space>
        </div>
      )}

      <div className="assessment-flow-builder-page-body">
        {!(isView && draft.is_preset) && renderDeptCard()}
        {renderLevelsCard()}
        {renderModelsCard()}
      </div>
    </div>
  );
};

export default AssessmentFlowBuilderPage;
