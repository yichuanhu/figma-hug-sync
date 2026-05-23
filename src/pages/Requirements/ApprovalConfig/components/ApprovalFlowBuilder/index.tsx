/**
 * 审批配置 Builder：新建/编辑审批流
 * 头部交互参考 SchemeBuilder（返回、可编辑名称、保存、启用），
 * 主体复用「需求模板 → 工作流 → 审批人配置」卡片。
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
  type ApprovalFlowTemplate,
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

const ApprovalFlowBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isView = location.pathname.includes('/detail/');
  const [draft, setDraft] = useState<ApprovalFlowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [activeTemplateIds, setActiveTemplateIds] = useState<string[]>([]);
  const [presetIds, setPresetIds] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const f = getApprovalFlowById(id);
    if (!f) {
      Toast.error('审批流不存在');
      navigate('/requirements/approval-config');
      return;
    }
    // 适用部门：优先取实体上的字段；为空则回填 binding 表中已绑定到本模板的部门
    const applicable = f.applicable_department_ids && f.applicable_department_ids.length > 0
      ? f.applicable_department_ids
      : listDepartmentsByTemplate(f.id);
    setDraft({
      ...f,
      assessors: f.assessors ?? [],
      approvers: f.approvers ?? [],
      applicable_department_ids: applicable,
    });
    // 拉取所有已激活模板（草稿态不占用部门）
    fetchApprovalFlows().then((all) => {
      setActiveTemplateIds(all.filter((x) => x.status === 'active').map((x) => x.id));
      setPresetIds(all.filter((x) => x.is_preset).map((x) => x.id));
    });
    setLoading(false);
  }, [id, navigate]);

  const patch = (p: Partial<ApprovalFlowTemplate>) => {
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  const guardedNavigate = (to: string) => {
    if (!dirty) {
      navigate(to);
      return;
    }
    Modal.confirm({
      title: '离开当前页？',
      content: '当前已有未保存的修改，离开后修改将丢失。',
      okText: '离开',
      cancelText: '继续编辑',
      okButtonProps: { type: 'danger' },
      onOk: () => navigate(to),
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Toast.warning('请填写审批流名称');
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
    // R-04：选中父部门时自动展开所有子部门写入绑定
    const expandedDeptIds = expandDepartmentIdsWithDescendants(selectedDeptIds);
    try {
      const updated = await updateApprovalFlow(draft.id, {
        name: draft.name,
        code: draft.code,
        description: draft.description,
        approvers: draft.approvers,
        assessors: draft.assessors,
        value_model: draft.value_model,
        complexity_model: draft.complexity_model,
        applicable_department_ids: selectedDeptIds,
      });
      setBindingsForTemplate(draft.id, expandedDeptIds);
      setDraft(updated);
      setDirty(false);
      Toast.success('已保存');
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
      title: '启用审批流',
      content: `确认将「${draft.name}」启用？启用后该流程将对所选 ${deptIds.length} 个部门的需求生效。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateApprovalFlow(draft.id);
        Toast.success('启用成功');
        navigate('/requirements/approval-config');
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
    <div className="approval-flow-builder">
      <div className="approval-flow-builder-header">
        <div className="approval-flow-builder-header-left">
          <Tooltip content={t('common.back')} position="bottom">
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={() => guardedNavigate('/requirements/approval-config')}
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
              {draft.status === 'active' && <Tag color="green" type="light" size="small">已启用</Tag>}
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
            draft.is_preset ? null : (
              <>
                <Button
                  icon={<Pencil size={16} strokeWidth={2} />}
                  theme="light"
                  type="tertiary"
                  onClick={() => navigate(`/requirements/approval-config/builder/${draft.id}`)}
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
          {/* 适用部门：保存时同步写入 department_approval_flow_binding（business_type=REQUIREMENT） */}
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
                    已被其他生效审批流占用的部门将不可选；选中父部门时会自动包含其所有子部门。
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
                        getOccupiedDepartmentMap(draft.id, activeTemplateIds),
                        (ownerId) => getApprovalFlowById(ownerId)?.name ?? '其他审批流',
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
        </div>
      </div>
    </div>
  );
};

export default ApprovalFlowBuilderPage;
