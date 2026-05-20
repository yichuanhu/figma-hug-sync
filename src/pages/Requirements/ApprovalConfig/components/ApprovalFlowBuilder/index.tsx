/**
 * 审批配置 Builder：新建/编辑审批流
 * 头部交互参考 SchemeBuilder（返回、可编辑名称、保存、启用），
 * 主体复用「需求模板 → 工作流 → 审批人配置」卡片。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Toast, Modal, Space, Tag, Spin, Tooltip, Banner } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, CheckCircle, Pencil, Building2 } from 'lucide-react';
import {
  getApprovalFlowById,
  updateApprovalFlow,
  activateApprovalFlow,
  type ApprovalFlowTemplate,
} from '../../mockData';
import ApproverListEditor from '../ApproverListEditor';
import AssessmentBuilder from '@/pages/Requirements/RequirementsScheme/components/SchemeBuilder/AssessmentBuilder';
import DepartmentSelect from '@/components/DepartmentSelect';
import {
  setBindingsForTemplate,
  listDepartmentsByTemplate,
} from '@/mocks/departmentApprovalFlowBinding';
import { getDepartmentName } from '@/mocks/departmentData';
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
    try {
      const deptIds = draft.applicable_department_ids ?? [];
      const updated = await updateApprovalFlow(draft.id, {
        name: draft.name,
        code: draft.code,
        description: draft.description,
        approvers: draft.approvers,
        assessors: draft.assessors,
        value_model: draft.value_model,
        complexity_model: draft.complexity_model,
        applicable_department_ids: deptIds,
      });
      // 同步部门绑定表
      const result = setBindingsForTemplate(draft.id, deptIds);
      const overriddenCount = Object.keys(result.overridden).length;
      setDraft(updated);
      setDirty(false);
      if (overriddenCount > 0) {
        Toast.success(`已保存，其中 ${overriddenCount} 个部门已从其他审批流改绑至本模板`);
      } else {
        Toast.success('已保存');
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
    Modal.confirm({
      title: '启用审批流',
      content: `确认将「${draft.name}」设为当前生效的审批流？同一时间仅一个审批流处于启用状态。`,
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
              draft.description ? (
                <Typography.Text type="tertiary" size="small" style={{ marginTop: 4 }}>
                  {draft.description}
                </Typography.Text>
              ) : null
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
