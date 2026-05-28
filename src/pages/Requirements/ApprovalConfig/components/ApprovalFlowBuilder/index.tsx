/**
 * 审批配置 Builder：新建/编辑审批流（FEAT-017 STORY-016 + FEAT-025 STORY-001）
 *
 * 通过 `businessType` + `basePath` 区分需求审批与流程发布审批：
 *   - REQUIREMENT      → /requirements/approval-config
 *   - PROCESS_PUBLISH  → /dev-center/publish-approval-templates
 *
 * 当 businessType=PROCESS_PUBLISH 时：
 *   - 隐藏「技术评估人配置」与价值/复杂度模型（assessment 始终 disabled）
 *   - 部门占用提示文案改为「发布审批模板」
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Toast, Modal, Space, Tag, Spin, Tooltip } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, CheckCircle, Pencil, Building2, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import {
  getApprovalFlowById,
  fetchApprovalFlows,
  updateApprovalFlow,
  activateApprovalFlow,
  createApprovalFlowDraft,
  type ApprovalFlowTemplate,
  type ApprovalBusinessType,
} from '../../mockData';
import ApproverListEditor from '../ApproverListEditor';
import AssessmentBuilder from '@/pages/Requirements/RequirementsScheme/components/SchemeBuilder/AssessmentBuilder';
import DepartmentPicker from '@/components/DepartmentPicker';
import {
  setBindingsForTemplate,
  listDepartmentsByTemplate,
  getOccupiedDepartmentMap,
} from '@/mocks/departmentApprovalFlowBinding';
import { getDepartmentName, expandDepartmentIdsWithDescendants } from '@/mocks/departmentData';
import { computeDeptDisabledOptions } from '@/pages/Requirements/_shared/computeDeptDisabledOptions';
import './index.less';

const { Title } = Typography;

interface ApprovalFlowBuilderPageProps {
  businessType?: ApprovalBusinessType;
  basePath?: string;
  /** 嵌入模式（用于在抽屉内复用本组件） */
  embedded?: boolean;
  /** 嵌入模式下当前模板 id，可为 'new' */
  embeddedId?: string;
  /** 嵌入模式下是否查看态 */
  embeddedView?: boolean;
  /** 嵌入模式下关闭回调 */
  onEmbeddedClose?: () => void;
  /** 嵌入模式下切换到编辑（从详情态切到编辑态） */
  onEmbeddedSwitchEdit?: (id: string) => void;
  /** 嵌入模式下保存草稿成功后回调（用于把 new -> id 切换） */
  onEmbeddedSaved?: (saved: ApprovalFlowTemplate) => void;
  /** 嵌入模式下切换到另一个详情 */
  onEmbeddedNavigate?: (id: string) => void;
}

const ApprovalFlowBuilderPage = ({
  businessType = 'REQUIREMENT',
  basePath = '/requirements/approval-config',
  embedded = false,
  embeddedId,
  embeddedView,
  onEmbeddedClose,
  onEmbeddedSwitchEdit,
  onEmbeddedSaved,
  onEmbeddedNavigate,
}: ApprovalFlowBuilderPageProps) => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const id = embedded ? embeddedId : params.id;
  const isView = embedded ? !!embeddedView : location.pathname.includes('/detail/');
  const closeOrBack = () => {
    if (embedded) onEmbeddedClose?.();
    else navigate(basePath);
  };
  const isPublish = businessType === 'PROCESS_PUBLISH';
  const isOffline = businessType === 'PROCESS_OFFLINE';
  const isProcessFlow = isPublish || isOffline;
  const [draft, setDraft] = useState<ApprovalFlowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [activeTemplateIds, setActiveTemplateIds] = useState<string[]>([]);
  const [presetIds, setPresetIds] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const isNew = id === 'new';
  const codePrefix = isPublish ? 'PUB' : isOffline ? 'OFF' : 'FLOW';
  const idPrefix = isPublish ? 'pflow' : isOffline ? 'oflow' : 'flow';
  const defaultName = isPublish ? '未命名发布审批模板' : isOffline ? '未命名停用审批模板' : '未命名审批流';
  const flowKindLabel = isPublish ? '发布审批模板' : isOffline ? '停用审批模板' : '审批流';
  const businessLabel = isPublish ? '流程发布' : isOffline ? '流程停用' : '需求';

  useEffect(() => {
    fetchApprovalFlows(undefined, businessType).then((all) => {
      setActiveTemplateIds(all.filter((x) => x.status === 'active').map((x) => x.id));
      setPresetIds(all.filter((x) => x.is_preset).map((x) => x.id));
    });

    if (isNew) {
      const now = new Date().toISOString();
      setDraft({
        id: 'new',
        name: defaultName,
        code: `${codePrefix}-${Date.now().toString(36).slice(-5).toUpperCase()}`,
        description: '',
        status: 'inactive',
        is_draft: true,
        business_type: businessType,
        approval_enabled: true,
        approvers: [],
        assessors: [],
        applicable_department_ids: [],
        created_at: now,
        updated_at: now,
      } as ApprovalFlowTemplate);
      setDirty(true);
      setLoading(false);
      return;
    }

    if (!id) return;
    const f = getApprovalFlowById(id);
    if (!f) {
      Toast.error('模板不存在');
      navigate(basePath);
      return;
    }
    const applicable = f.applicable_department_ids && f.applicable_department_ids.length > 0
      ? f.applicable_department_ids
      : listDepartmentsByTemplate(f.id, businessType);
    setDraft({
      ...f,
      assessors: f.assessors ?? [],
      approvers: f.approvers ?? [],
      applicable_department_ids: applicable,
    });
    setLoading(false);
  }, [id, isNew, navigate, businessType, basePath, codePrefix, defaultName]);

  const patch = (p: Partial<ApprovalFlowTemplate>) => {
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  const guardedClose = () => {
    const doClose = () => (embedded ? onEmbeddedClose?.() : navigate(basePath));
    if (!dirty) {
      doClose();
      return;
    }
    Modal.confirm({
      title: '离开当前页？',
      content: '当前已有未保存的修改，离开后修改将丢失。',
      okText: '离开',
      cancelText: '继续编辑',
      okButtonProps: { type: 'danger' },
      onOk: doClose,
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Toast.warning('请填写模板名称');
      return;
    }
    if (draft.approvers.length === 0) {
      Toast.warning('至少需要一个审批级');
      return;
    }
    for (const a of draft.approvers) {
      if (!a.name.trim()) {
        Toast.warning('请填写所有审批级名称');
        return;
      }
      if ((a.type === 'specific_users' || a.type === 'role') && (!a.target_ids || a.target_ids.length === 0)) {
        Toast.warning(`「${a.name}」请选择审批人`);
        return;
      }
    }
    const selectedDeptIds = draft.applicable_department_ids ?? [];
    if (selectedDeptIds.length === 0) {
      Toast.warning('请选择适用部门');
      return;
    }
    const expandedDeptIds = expandDepartmentIdsWithDescendants(selectedDeptIds);
    try {
      let saved: ApprovalFlowTemplate;
      if (isNew) {
        saved = await createApprovalFlowDraft({
          name: draft.name,
          code: draft.code,
          description: draft.description,
          approval_enabled: draft.approval_enabled,
          approvers: draft.approvers,
          assessors: isProcessFlow ? [] : draft.assessors,
          value_model: isProcessFlow ? undefined : draft.value_model,
          complexity_model: isProcessFlow ? undefined : draft.complexity_model,
        }, businessType);
        saved = await updateApprovalFlow(saved.id, {
          applicable_department_ids: selectedDeptIds,
        });
      } else {
        saved = await updateApprovalFlow(draft.id, {
          name: draft.name,
          code: draft.code,
          description: draft.description,
          approval_enabled: draft.approval_enabled,
          approvers: draft.approvers,
          assessors: isProcessFlow ? [] : draft.assessors,
          value_model: isProcessFlow ? undefined : draft.value_model,
          complexity_model: isProcessFlow ? undefined : draft.complexity_model,
          applicable_department_ids: selectedDeptIds,
        });
      }
      setBindingsForTemplate(saved.id, expandedDeptIds, businessType);
      setDraft(saved);
      setDirty(false);
      Toast.success('已保存');
      if (isNew) {
        if (embedded) onEmbeddedSaved?.(saved);
        else navigate(`${basePath}/builder/${saved.id}`, { replace: true });
      }
    } catch (e) {
      Toast.error((e as Error).message);
    }
  };

  const handleActivate = () => {
    if (!draft) return;
    if (dirty) {
      Toast.warning('请先保存当前修改后再启用');
      return;
    }
    const deptIds = draft.applicable_department_ids ?? [];
    if (deptIds.length === 0) {
      Toast.warning('请先选择「适用部门」，启用时至少选择 1 个部门');
      return;
    }
    Modal.confirm({
      title: `启用${flowKindLabel}`,
      content: `确认将「${draft.name}」启用？启用后将对所选 ${deptIds.length} 个部门的${businessLabel}生效。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateApprovalFlow(draft.id);
        Toast.success('启用成功');
        if (embedded) onEmbeddedClose?.();
        else navigate(basePath);
      },
    });
  };

  if (loading || !draft) {
    return (
      <div className="approval-flow-builder-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`approval-flow-builder${fullscreen ? ' approval-flow-builder--fullscreen' : ''}`}>
      <div className="approval-flow-builder-header">
        <div className="approval-flow-builder-header-left">
          <Tooltip content={t('common.back')} position="bottom">
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={guardedClose}
            />
          </Tooltip>
          <div className="approval-flow-builder-title-block">
            <div className="approval-flow-builder-title-row">
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
                  className="approval-flow-builder-header-title"
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
              <Typography.Text type="tertiary" size="small" style={{ marginTop: 4 }}>
                {draft.description || '暂无描述'}
              </Typography.Text>
            ) : (
              <Input
                value={draft.description ?? ''}
                onChange={(v) => patch({ description: v })}
                placeholder="添加描述..."
                maxLength={120}
                size="small"
                className="approval-flow-builder-description-input"
              />
            )}
          </div>
        </div>
        <Space>
          {isView ? (
            draft.is_preset ? (() => {
              const idx = presetIds.indexOf(draft.id);
              const prevId = idx > 0 ? presetIds[idx - 1] : null;
              const nextId = idx >= 0 && idx < presetIds.length - 1 ? presetIds[idx + 1] : null;
              return (
                <>
                  <Tooltip content="上一个" position="bottom">
                    <Button
                      icon={<ChevronLeft size={16} strokeWidth={2} />}
                      theme="borderless"
                      type="tertiary"
                      disabled={!prevId}
                      onClick={() => prevId && navigate(`${basePath}/detail/${prevId}`)}
                    />
                  </Tooltip>
                  <Tooltip content="下一个" position="bottom">
                    <Button
                      icon={<ChevronRight size={16} strokeWidth={2} />}
                      theme="borderless"
                      type="tertiary"
                      disabled={!nextId}
                      onClick={() => nextId && navigate(`${basePath}/detail/${nextId}`)}
                    />
                  </Tooltip>
                  <div style={{ width: 1, height: 16, background: 'var(--semi-color-border)', margin: '0 4px' }} />
                  <Tooltip content={fullscreen ? '退出全屏' : '全屏'} position="bottom">
                    <Button
                      icon={fullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
                      theme="borderless"
                      type="tertiary"
                      onClick={() => setFullscreen((v) => !v)}
                    />
                  </Tooltip>
                  <Tooltip content="关闭" position="bottom">
                    <Button
                      icon={<X size={16} strokeWidth={2} />}
                      theme="borderless"
                      type="tertiary"
                      onClick={() => navigate(basePath)}
                    />
                  </Tooltip>
                </>
              );
            })() : (
              <>
                <Button
                  icon={<Pencil size={16} strokeWidth={2} />}
                  theme="light"
                  type="tertiary"
                  onClick={() => navigate(`${basePath}/builder/${draft.id}`)}
                >
                  编辑
                </Button>
                {draft.status !== 'active' && (
                  <Button
                    icon={<CheckCircle size={16} strokeWidth={2} />}
                    theme="solid"
                    type="primary"
                    onClick={handleActivate}
                  >
                    启用
                  </Button>
                )}
              </>
            )
          ) : (
            <>
              <Button
                icon={<Save size={16} strokeWidth={2} />}
                theme={dirty ? 'solid' : 'light'}
                type={dirty ? 'primary' : 'tertiary'}
                onClick={handleSave}
                disabled={!dirty}
              >
                保存
              </Button>
              <Button
                icon={<CheckCircle size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={handleActivate}
                disabled={draft.status === 'active'}
              >
                启用
              </Button>
            </>
          )}
        </Space>
      </div>

      <div className="approval-flow-builder-body">
        <div className="workflow-builder">
          {!(isView && draft.is_preset) && (() => {
            const deptCount = (draft.applicable_department_ids ?? []).length;
            return (
              <div className="approval-flow-section-card">
                <div className="approval-flow-section-card-header">
                  <div className="approval-flow-section-card-title">
                    <Building2 size={16} strokeWidth={2} />
                    <span>适用部门</span>
                    {!isView && (
                      <>
                        <Typography.Text type="danger" size="small" style={{ marginLeft: 2 }}>*</Typography.Text>
                        <Typography.Text type="tertiary" size="small" style={{ marginLeft: 4, fontWeight: 400 }}>
                          （启用时必填，草稿可留空）
                        </Typography.Text>
                      </>
                    )}
                  </div>
                  <Typography.Text type="tertiary" size="small">
                    {isProcessFlow
                      ? `已被其他生效${flowKindLabel}占用的部门将不可选；激活时系统会按当前部门树展开子部门并写入生效绑定。`
                      : '已被其他生效方案占用的部门将不可选；激活时系统会按当前部门树展开子部门并写入生效绑定。'}
                  </Typography.Text>
                </div>
                <div className="approval-flow-section-card-body">
                  {isView ? (
                    deptCount > 0 ? (
                      <Space wrap>
                        {draft.applicable_department_ids!.map((id) => (
                          <Tag key={id} color="violet" type="light" size="large" prefixIcon={<Building2 size={12} strokeWidth={2} />}>
                            {getDepartmentName(id)}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <Typography.Text type="tertiary">尚未配置适用部门</Typography.Text>
                    )
                  ) : (
                    <DepartmentPicker
                      value={draft.applicable_department_ids ?? []}
                      onChange={(ids) => patch({ applicable_department_ids: ids })}
                      placeholder="请选择适用部门（可多选，选中父部门自动包含子部门）"
                      maxTagCount={6}
                      disabledOptions={computeDeptDisabledOptions(
                        getOccupiedDepartmentMap(draft.id, activeTemplateIds, businessType),
                        (tid) => getApprovalFlowById(tid)?.name ?? (isProcessFlow ? `其他生效${flowKindLabel}` : '其他生效审批流'),
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })()}

          <ApproverListEditor
            title="审批人配置"
            approvers={draft.approvers}
            onChange={(approvers) => patch({ approvers })}
            emptyHint="暂无审批级，点击右上角添加"
            defaultItemName="新审批级"
            readOnly={isView}
          />

          {!isProcessFlow && (
            <ApproverListEditor
              title="技术评估人配置"
              approvers={draft.assessors}
              onChange={(assessors) => patch({ assessors })}
              emptyHint="暂无评估级，点击右上角添加"
              defaultItemName="新评估级"
              readOnly={isView}
              extra={
                draft.assessors.length > 0 ? (
                  <AssessmentBuilder
                    valueModel={draft.value_model}
                    complexityModel={draft.complexity_model}
                    fields={[]}
                    onChange={(value_model, complexity_model) => patch({ value_model, complexity_model })}
                    disabled={isView}
                  />
                ) : null
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalFlowBuilderPage;
