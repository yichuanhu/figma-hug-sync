import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Typography, Empty, Input, Switch, Tag, Toast } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown, PowerOff } from 'lucide-react';
import { buildWorkflowFromTemplate } from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import AssessmentBuilder from '../AssessmentBuilder';
import type {
  WorkflowConfig,
  WorkflowApprover,
  WorkflowApproverType,
  WorkflowApprovalMode,
  AssessmentModel,
  SchemeField,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text, Title } = Typography;

interface Props {
  workflow?: WorkflowConfig;
  onChange: (wf: WorkflowConfig) => void;
  /** 关闭审批流时同步清空评估模型 */
  onClearAssessment?: () => void;
  /** 评估模型（嵌入显示） */
  valueModel?: AssessmentModel;
  complexityModel?: AssessmentModel;
  fields?: SchemeField[];
  onChangeAssessment?: (value?: AssessmentModel, complexity?: AssessmentModel) => void;
}

const APPROVER_TYPE_OPTIONS: Array<{ value: WorkflowApproverType; label: string }> = [
  { value: 'department_leader', label: '部门领导' },
  { value: 'specific_users', label: '指定用户' },
  { value: 'role', label: '角色' },
];

const MODE_OPTIONS: Array<{ value: WorkflowApprovalMode; label: string }> = [
  { value: 'any_one', label: '任一通过' },
  { value: 'all', label: '会签（全部）' },
  { value: 'majority', label: '多数通过' },
];

const USER_OPTIONS = [
  { value: 'user-001', label: 'John Smith' },
  { value: 'user-002', label: 'Emily Chen' },
  { value: 'user-003', label: 'Michael Wang' },
  { value: 'user-004', label: 'Sarah Li' },
];
const ROLE_OPTIONS = [
  { value: 'role-line-manager', label: '直属主管' },
  { value: 'role-dept-head', label: '部门负责人' },
  { value: 'role-committee', label: '委员会' },
];

const DISABLED_WORKFLOW: WorkflowConfig = { template: 'none', states: [], approvers: [], assessors: [] };

const ApproverList = ({
  title,
  emptyHint,
  list,
  onChange,
}: {
  title: string;
  emptyHint: string;
  list: WorkflowApprover[];
  onChange: (next: WorkflowApprover[]) => void;
}) => {
  const update = (idx: number, p: WorkflowApprover) => onChange(list.map((x, i) => (i === idx ? p : x)));
  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...list];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    next.forEach((x, i) => (x.priority = i + 1));
    onChange(next);
  };
  const add = () => {
    onChange([
      ...list,
      {
        id: `appr-${Date.now().toString(36).slice(-4)}`,
        name: '新审批级',
        type: 'department_leader',
        priority: list.length + 1,
        required: true,
        approval_mode: 'any_one',
        timeout_days: 7,
      },
    ]);
  };

  return (
    <div className="workflow-section">
      <div className="scheme-builder-section-title">
        <span className="title">{title}</span>
        <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={add}>添加</Button>
      </div>
      {list.length === 0 ? (
        <Empty description={emptyHint} style={{ padding: '24px 0' }} />
      ) : (
        list.map((a, idx) => (
          <div key={a.id} className="approver-row">
            <Tag color="blue" type="light" size="small">P{a.priority}</Tag>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Input value={a.name} onChange={(v) => update(idx, { ...a, name: v })} placeholder="名称" size="small" />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Select value={a.type} onChange={(v) => update(idx, { ...a, type: v as WorkflowApproverType })}
                  optionList={APPROVER_TYPE_OPTIONS} size="small" style={{ width: 120 }} />
                <Select value={a.approval_mode ?? 'any_one'} onChange={(v) => update(idx, { ...a, approval_mode: v as WorkflowApprovalMode })}
                  optionList={MODE_OPTIONS} size="small" style={{ width: 120 }} />
                <Switch checked={a.required} onChange={(v) => update(idx, { ...a, required: v })} size="small" />
                <Text size="small" type="tertiary">必需</Text>
              </div>
              {(a.type === 'specific_users' || a.type === 'role') && (
                <Select multiple value={a.target_ids ?? []} onChange={(v) => update(idx, { ...a, target_ids: v as string[] })}
                  optionList={a.type === 'specific_users' ? USER_OPTIONS : ROLE_OPTIONS}
                  size="small" placeholder={a.type === 'specific_users' ? '选择用户' : '选择角色'} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Button icon={<ArrowUp size={12} strokeWidth={2} />} theme="borderless" size="small" disabled={idx === 0} onClick={() => move(idx, -1)} />
              <Button icon={<ArrowDown size={12} strokeWidth={2} />} theme="borderless" size="small" disabled={idx === list.length - 1} onClick={() => move(idx, 1)} />
            </div>
            <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={() => remove(idx)} />
          </div>
        ))
      )}
    </div>
  );
};

const WorkflowBuilder = ({ workflow, onChange, valueModel, complexityModel, fields = [], onChangeAssessment }: Props) => {
  const { t: _t } = useTranslation();
  const wf: WorkflowConfig = workflow ?? { template: 'simple', states: [], approvers: [], assessors: [] };
  const disabled = wf.template === 'none';

  // 缓存上一次启用状态下的配置，关闭后再启用可恢复，不丢失已配置内容
  const cachedWfRef = useRef<WorkflowConfig | null>(null);
  const cachedAssessmentRef = useRef<{ value?: AssessmentModel; complexity?: AssessmentModel } | null>(null);
  if (!disabled) {
    cachedWfRef.current = wf;
    cachedAssessmentRef.current = { value: valueModel, complexity: complexityModel };
  }

  const handleToggle = (next: boolean) => {
    if (next) {
      // 启用：优先恢复缓存配置；无缓存则用 simple 模板初始化审批人/评估人
      const restored = cachedWfRef.current;
      if (restored && restored.template !== 'none' && (restored.approvers.length > 0 || restored.assessors.length > 0)) {
        onChange(restored);
        const cachedAssess = cachedAssessmentRef.current;
        if (cachedAssess && onChangeAssessment) {
          onChangeAssessment(cachedAssess.value, cachedAssess.complexity);
        }
        Toast.success('已恢复审批流配置');
      } else {
        onChange(buildWorkflowFromTemplate('simple'));
        Toast.success('已启用审批流');
      }
      return;
    }
    // 关闭：仅切换为 none，不清空缓存与评估模型；评估模型 UI 会因 assessors 不再显示而隐藏，但数据保留
    onChange(DISABLED_WORKFLOW);
    Toast.success('已关闭审批流');
  };

  return (
    <div className="workflow-builder">
      <div className="workflow-toggle-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--semi-color-fill-0)', borderRadius: 8, marginBottom: 16,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>审批配置</Text>
          {disabled
            ? <Tag color="orange" type="light" size="small">已关闭</Tag>
            : <Tag color="green" type="light" size="small">已启用</Tag>}
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text type="tertiary" size="small">启用审批流</Text>
          <Switch checked={!disabled} onChange={handleToggle} />
        </span>
      </div>

      {disabled ? (
        <div className="workflow-disabled-empty" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '48px 24px', background: 'var(--semi-color-bg-1)', borderRadius: 8,
        }}>
          <div className="icon-wrap" style={{ color: 'var(--semi-color-text-2)' }}>
            <PowerOff size={28} strokeWidth={1.5} />
          </div>
          <Title heading={6} style={{ margin: 0 }}>已关闭审批流</Title>
          <Text type="tertiary" style={{ textAlign: 'center', maxWidth: 480 }}>
            使用此模版提交的需求将跳过审批与评估环节，直接进入「待立项」状态。
            如需恢复审批流程，请打开右上角「启用审批流」开关。
          </Text>
        </div>
      ) : (
        <>
          <div className="workflow-config-grid">
            <ApproverList
              title="审批人配置"
              emptyHint="暂无审批级，点击右上角添加"
              list={wf.approvers}
              onChange={(list) => onChange({ ...wf, approvers: list })}
            />
            <ApproverList
              title="技术评估人配置"
              emptyHint="暂无评估级，点击右上角添加。设置后可在下方配置评估模型。"
              list={wf.assessors}
              onChange={(list) => {
                onChange({ ...wf, assessors: list });
                if (list.length === 0) {
                  onChangeAssessment?.(undefined, undefined);
                }
              }}
            />
          </div>

          {wf.assessors.length > 0 && onChangeAssessment && (
            <div style={{ marginTop: 16 }}>
              <AssessmentBuilder
                valueModel={valueModel}
                complexityModel={complexityModel}
                fields={fields}
                onChange={onChangeAssessment}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowBuilder;
