/**
 * 审批与评估配置 - 多方案管理
 *
 * 左侧：方案列表（含系统预设；预设可复制不可编辑/删除/停用）
 * 右侧：选中方案详情（审批 + 评估）
 * 顶部：激活/保存/复制/删除/历史
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Typography,
  Switch,
  Button,
  Toast,
  Space,
  Spin,
  Tag,
  Modal,
  Banner,
  Input,
  TextArea,
  Tooltip,
  Empty,
} from '@douyinfe/semi-ui';
import {
  History,
  Save,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  fetchSchemes,
  saveScheme,
  validateScheme,
  subscribeConfigChange,
  createScheme,
  deleteScheme,
  activateScheme,
  type ApprovalAssessmentScheme,
} from './mockData';
import ApprovalLevelList from './components/ApprovalLevelList';
import AssessorGroupList from './components/AssessorGroupList';
import AssessmentModelCard from './components/AssessmentModelCard';
import ConfigHistoryDrawer from './components/ConfigHistoryDrawer';
import './index.less';

const { Title, Text } = Typography;

const ApprovalAssessmentConfigPage = () => {
  const [schemes, setSchemes] = useState<ApprovalAssessmentScheme[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ApprovalAssessmentScheme | null>(null);
  const [original, setOriginal] = useState<ApprovalAssessmentScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState<{ name: string; description: string; sourceId: string }>({
    name: '',
    description: '',
    sourceId: '',
  });

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchSchemes();
      setSchemes(list);
      const currentId = selectedIdRef.current;
      const next =
        list.find((s) => s.id === currentId) ?? list.find((s) => s.is_active) ?? list[0];
      if (next) {
        setSelectedId(next.id);
        setDraft(JSON.parse(JSON.stringify(next)));
        setOriginal(JSON.parse(JSON.stringify(next)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeConfigChange(() => load()), [load]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original],
  );

  const errors = useMemo(() => (draft ? validateScheme(draft) : []), [draft]);

  const isPreset = !!draft?.is_preset;
  const readonly = isPreset;

  const patch = (p: Partial<ApprovalAssessmentScheme>) =>
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));

  const handleSelect = (id: string) => {
    if (id === selectedId) return;
    const doSwitch = () => {
      const target = schemes.find((s) => s.id === id);
      if (!target) return;
      setSelectedId(id);
      setDraft(JSON.parse(JSON.stringify(target)));
      setOriginal(JSON.parse(JSON.stringify(target)));
    };
    if (dirty) {
      Modal.confirm({
        title: '切换方案',
        content: '当前方案存在未保存的修改，切换将丢弃。是否继续？',
        okText: '继续切换',
        cancelText: '取消',
        onOk: doSwitch,
      });
    } else {
      doSwitch();
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    if (errors.length > 0) {
      Toast.error('存在校验错误，请修正后再保存');
      return;
    }
    setSaving(true);
    try {
      const next = await saveScheme(draft.id, draft);
      setDraft(JSON.parse(JSON.stringify(next)));
      setOriginal(JSON.parse(JSON.stringify(next)));
      Toast.success(`已保存为 v${next.version}`);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!dirty) return;
    Modal.confirm({
      title: '放弃修改',
      content: '当前修改尚未保存，确认放弃？',
      okText: '放弃',
      cancelText: '取消',
      onOk: () => setDraft(original ? JSON.parse(JSON.stringify(original)) : null),
    });
  };

  const handleActivate = () => {
    if (!draft) return;
    if (draft.is_active) return;
    if (dirty) {
      Toast.warning('请先保存当前修改后再激活');
      return;
    }
    if (errors.length > 0) {
      Toast.error('该方案存在校验错误，无法激活');
      return;
    }
    Modal.confirm({
      title: '切换激活方案',
      content: (
        <div>
          确认将「{draft.name}」设为当前激活方案？
          <br />
          切换后，所有<strong>新建需求</strong>将走该方案的审批与评估流程；
          <br />
          已在审批中的需求<strong>不受影响</strong>。
        </div>
      ),
      okText: '确认激活',
      cancelText: '取消',
      onOk: async () => {
        try {
          await activateScheme(draft.id);
          Toast.success('已激活');
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!draft || draft.is_preset || draft.is_active) return;
    Modal.confirm({
      title: '删除方案',
      content: `确认删除方案「${draft.name}」？删除后该方案的全部历史快照一并清除。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteScheme(draft.id);
          setSelectedId(null);
          Toast.success('已删除');
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const openCreate = (sourceId: string) => {
    const src = schemes.find((s) => s.id === sourceId) ?? schemes[0];
    setCreateForm({
      name: '',
      description: '',
      sourceId: src?.id ?? '',
    });
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      Toast.error('请输入方案名称');
      return;
    }
    if (!createForm.sourceId) {
      Toast.error('请选择复制来源');
      return;
    }
    try {
      const created = await createScheme({
        name: createForm.name,
        description: createForm.description || undefined,
        source_scheme_id: createForm.sourceId,
      });
      setCreateModalVisible(false);
      setSelectedId(created.id);
      Toast.success('方案已创建');
    } catch (e) {
      Toast.error((e as Error).message);
    }
  };

  if (loading || !draft) {
    return (
      <div className="approval-config-page">
        <Spin />
      </div>
    );
  }

  return (
    <div className="approval-config-page">
      <div className="approval-config-page-header">
        <div className="approval-config-page-header-title">
          <Title heading={3} className="title">
            审批与评估配置
          </Title>
          <Text type="tertiary">
            可创建多套方案，仅一套方案处于激活状态；新建需求将走当前激活方案的流程。
          </Text>
        </div>
      </div>

      <div className="approval-config-layout">
        {/* 左侧：方案列表 */}
        <aside className="scheme-list-panel">
          <div className="scheme-list-head">
            <Text strong>方案列表</Text>
            <Button
              icon={<Plus size={14} strokeWidth={2} />}
              size="small"
              theme="solid"
              type="primary"
              onClick={() => openCreate(draft?.id ?? schemes[0]?.id ?? '')}
            >
              新建方案
            </Button>
          </div>
          <div className="scheme-list-body">
            {schemes.length === 0 ? (
              <Empty description="暂无方案" />
            ) : (
              schemes.map((s) => {
                const active = s.id === selectedId;
                return (
                  <div
                    key={s.id}
                    className={`scheme-item${active ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(s.id)}
                  >
                    <div className="scheme-item-row">
                      <Text strong ellipsis={{ showTooltip: true }} style={{ flex: 1, minWidth: 0 }}>
                        {s.name}
                      </Text>
                      {s.is_active && (
                        <Tag color="green" type="solid" size="small" prefixIcon={<CheckCircle2 size={10} strokeWidth={2.5} />}>
                          已激活
                        </Tag>
                      )}
                    </div>
                    <div className="scheme-item-row">
                      {s.is_preset ? (
                        <Tag color="grey" type="light" size="small" prefixIcon={<Lock size={10} strokeWidth={2.5} />}>
                          系统预设
                        </Tag>
                      ) : (
                        <Tag color="blue" type="light" size="small">
                          自定义
                        </Tag>
                      )}
                      <Text type="tertiary" size="small">
                        v{s.version}
                      </Text>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* 右侧：方案详情 */}
        <section className="scheme-detail-panel">
          <div className="scheme-detail-head">
            <div className="scheme-detail-head-meta">
              <Space spacing={8} align="center" wrap>
                <Title heading={5} style={{ margin: 0 }}>
                  {draft.name}
                </Title>
                {draft.is_active && (
                  <Tag color="green" type="solid" size="small">
                    已激活
                  </Tag>
                )}
                {draft.is_preset && (
                  <Tag color="grey" type="light" size="small" prefixIcon={<Lock size={10} strokeWidth={2.5} />}>
                    系统预设
                  </Tag>
                )}
                <Tag color="blue" type="light" size="small">
                  v{draft.version}
                </Tag>
                <Text type="tertiary" size="small">
                  {new Date(draft.updated_at).toLocaleString()} · {draft.updated_by}
                </Text>
              </Space>
              {draft.description && (
                <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
                  {draft.description}
                </Text>
              )}
            </div>
            <Space>
              <Button icon={<History size={14} strokeWidth={2} />} onClick={() => setHistoryVisible(true)}>
                配置历史
              </Button>
              <Button icon={<Copy size={14} strokeWidth={2} />} onClick={() => openCreate(draft.id)}>
                复制为新方案
              </Button>
              {!draft.is_preset && !draft.is_active && (
                <Tooltip content="删除后该方案的全部历史快照将被清除">
                  <Button
                    icon={<Trash2 size={14} strokeWidth={2} />}
                    type="danger"
                    onClick={handleDelete}
                  >
                    删除
                  </Button>
                </Tooltip>
              )}
              {!draft.is_active && (
                <Button
                  icon={<CheckCircle2 size={14} strokeWidth={2} />}
                  theme="light"
                  type="primary"
                  disabled={dirty || errors.length > 0}
                  onClick={handleActivate}
                >
                  激活此方案
                </Button>
              )}
              {!readonly && (
                <>
                  <Button icon={<RotateCcw size={14} strokeWidth={2} />} disabled={!dirty} onClick={handleReset}>
                    放弃修改
                  </Button>
                  <Button
                    icon={<Save size={14} strokeWidth={2} />}
                    theme="solid"
                    type="primary"
                    loading={saving}
                    disabled={!dirty || errors.length > 0}
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                </>
              )}
            </Space>
          </div>

          {readonly && (
            <Banner
              type="info"
              fullMode={false}
              closeIcon={null}
              description="系统预设方案为只读，不可编辑或删除。如需调整，请使用「复制为新方案」生成自定义副本后再修改。"
              style={{ marginBottom: 12 }}
            />
          )}

          {!readonly && errors.length > 0 && (
            <Banner
              type="danger"
              fullMode={false}
              closeIcon={null}
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {errors.map((e, i) => (
                    <li key={i}>
                      <Text size="small">
                        [{e.code}] {e.message}
                      </Text>
                    </li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          <div className="approval-config-page-content">
            {/* 基本信息 */}
            {!readonly && (
              <section className="config-section">
                <div className="config-section-head">
                  <div>
                    <Title heading={5} style={{ margin: 0 }}>
                      基本信息
                    </Title>
                    <Text type="tertiary" size="small">
                      方案名称与描述
                    </Text>
                  </div>
                </div>
                <div className="config-section-body">
                  <Input
                    value={draft.name}
                    onChange={(v) => patch({ name: v })}
                    placeholder="方案名称"
                    maxLength={50}
                    showClear
                  />
                  <TextArea
                    value={draft.description ?? ''}
                    onChange={(v) => patch({ description: v })}
                    placeholder="方案描述（选填）"
                    maxLength={200}
                    autosize={{ minRows: 2, maxRows: 4 }}
                  />
                </div>
              </section>
            )}

            {/* 审批配置区 */}
            <section className="config-section">
              <div className="config-section-head">
                <div>
                  <Title heading={5} style={{ margin: 0 }}>
                    审批配置
                  </Title>
                  <Text type="tertiary" size="small">
                    控制需求是否需要进入审批流程；启用后按层级串行审批
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text size="small" type="tertiary">
                    {draft.approval_enabled ? '已启用' : '已关闭'}
                  </Text>
                  <Switch
                    checked={draft.approval_enabled}
                    onChange={(v) => patch({ approval_enabled: v })}
                    disabled={readonly}
                  />
                </div>
              </div>
              {draft.approval_enabled && (
                <div className="config-section-body">
                  <ApprovalLevelList
                    levels={draft.approval_levels}
                    onChange={(approval_levels) => patch({ approval_levels })}
                    disabled={readonly}
                  />
                </div>
              )}
            </section>

            {/* 评估配置区 */}
            <section className="config-section">
              <div className="config-section-head">
                <div>
                  <Title heading={5} style={{ margin: 0 }}>
                    评估配置
                  </Title>
                  <Text type="tertiary" size="small">
                    控制需求是否需要技术评估；启用后由评估人组对价值与复杂度进行打分
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text size="small" type="tertiary">
                    {draft.assessment_enabled ? '已启用' : '已关闭'}
                  </Text>
                  <Switch
                    checked={draft.assessment_enabled}
                    onChange={(v) => patch({ assessment_enabled: v })}
                    disabled={readonly}
                  />
                </div>
              </div>
              {draft.assessment_enabled && (
                <div className="config-section-body">
                  <AssessorGroupList
                    groups={draft.assessor_groups}
                    onChange={(assessor_groups) => patch({ assessor_groups })}
                    disabled={readonly}
                  />
                  <AssessmentModelCard
                    model={draft.value_model}
                    onChange={(value_model) => patch({ value_model })}
                    disabled={readonly}
                  />
                  <AssessmentModelCard
                    model={draft.complexity_model}
                    onChange={(complexity_model) => patch({ complexity_model })}
                    disabled={readonly}
                  />
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <ConfigHistoryDrawer
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        schemeId={draft.id}
        schemeName={draft.name}
      />

      <Modal
        title="新建方案"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              方案名称<Text type="danger">*</Text>
            </Text>
            <Input
              value={createForm.name}
              onChange={(v) => setCreateForm((p) => ({ ...p, name: v }))}
              placeholder="请输入方案名称"
              maxLength={50}
              showClear
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              方案描述
            </Text>
            <TextArea
              value={createForm.description}
              onChange={(v) => setCreateForm((p) => ({ ...p, description: v }))}
              placeholder="选填"
              maxLength={200}
              autosize={{ minRows: 2, maxRows: 4 }}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              基于已有方案复制<Text type="danger">*</Text>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {schemes.map((s) => (
                <label
                  key={s.id}
                  className={`scheme-source-option${createForm.sourceId === s.id ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="scheme-source"
                    checked={createForm.sourceId === s.id}
                    onChange={() => setCreateForm((p) => ({ ...p, sourceId: s.id }))}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Text strong>{s.name}</Text>
                    {s.is_preset && (
                      <Tag color="grey" type="light" size="small" style={{ marginLeft: 6 }}>
                        系统预设
                      </Tag>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalAssessmentConfigPage;
