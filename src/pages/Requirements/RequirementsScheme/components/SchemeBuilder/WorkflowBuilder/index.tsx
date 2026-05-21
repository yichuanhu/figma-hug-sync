import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Typography, Empty, Input, Switch, Tag, Toast } from '@douyinfe/semi-ui';
import { Plus, Trash2, GripVertical, PowerOff } from 'lucide-react';
import { buildWorkflowFromTemplate } from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import AssessmentBuilder from '../AssessmentBuilder';
import type {
  WorkflowConfig,
  WorkflowApprover,
  WorkflowApproverType,
  WorkflowApprovalMode,
  AssessmentModel,
  SchemeField,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

interface Props {
  workflow?: WorkflowConfig;
  onChange: (wf: WorkflowConfig) => void;
  onClearAssessment?: () => void;
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

const ROLE_OPTIONS = [
  { value: 'role-line-manager', label: '直属主管' },
  { value: 'role-dept-head', label: '部门负责人' },
  { value: 'role-committee', label: '委员会' },
];

const ApproverList = ({
  list,
  emptyHint,
  onChange,
}: {
  list: WorkflowApprover[];
  emptyHint: string;
  onChange: (next: WorkflowApprover[]) => void;
}) => {
  const update = (idx: number, p: WorkflowApprover) => onChange(list.map((x, i) => (i === idx ? p : x)));
  const remove = (idx: number) => {
    const next = list.filter((_, i) => i !== idx);
    next.forEach((x, i) => (x.priority = i + 1));
    onChange(next);
  };

  const dragIndexRef = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    next.forEach((x, i) => (x.priority = i + 1));
    onChange(next);
  };

  if (list.length === 0) {
    return <Empty description={emptyHint} style={{ padding: '24px 0' }} />;
  }

  return (
    <>
      {list.map((a, idx) => (
        <div
          key={a.id}
          className={`approver-row${dragIdx === idx ? ' is-dragging' : ''}${overIdx === idx && dragIdx !== idx ? ' is-over' : ''}`}
          onDragOver={(e) => {
            if (dragIndexRef.current === null) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (overIdx !== idx) setOverIdx(idx);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const from = dragIndexRef.current;
            if (from !== null) reorder(from, idx);
            dragIndexRef.current = null;
            setDragIdx(null);
            setOverIdx(null);
          }}
        >
          <span
            className="drag-handle"
            draggable
            onDragStart={(e) => {
              dragIndexRef.current = idx;
              setDragIdx(idx);
              e.dataTransfer.effectAllowed = 'move';
              // Firefox 需要设置数据才能触发拖拽
              e.dataTransfer.setData('text/plain', String(idx));
            }}
            onDragEnd={() => {
              dragIndexRef.current = null;
              setDragIdx(null);
              setOverIdx(null);
            }}
            title="拖拽调整顺序"
          >
            <GripVertical size={14} strokeWidth={2} />
          </span>
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
            {a.type === 'specific_users' && (
              <OwnerSearchSelect
                multiple
                size="small"
                value={a.target_ids ?? []}
                onChange={(v: string | string[]) => update(idx, { ...a, target_ids: (Array.isArray(v) ? v : []) as string[] })}
                placeholder="搜索并选择用户"
              />
            )}
            {a.type === 'role' && (
              <Select multiple value={a.target_ids ?? []} onChange={(v) => update(idx, { ...a, target_ids: v as string[] })}
                optionList={ROLE_OPTIONS}
                size="small" placeholder="选择角色" />
            )}
          </div>
          <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={() => remove(idx)} />
        </div>
      ))}
    </>
  );
};

const makeApprover = (priority: number): WorkflowApprover => ({
  id: `appr-${Date.now().toString(36).slice(-4)}-${priority}`,
  name: '新审批级',
  type: 'department_leader',
  priority,
  required: true,
  approval_mode: 'any_one',
  timeout_days: 7,
});

const WorkflowBuilder = ({
  workflow,
  onChange,
  onClearAssessment,
  valueModel,
  complexityModel,
  fields = [],
  onChangeAssessment,
}: Props) => {
  const { t: _t } = useTranslation();
  const wf: WorkflowConfig = workflow ?? { template: 'simple', states: [], approvers: [], assessors: [] };

  const approverEnabled = wf.approvers.length > 0;
  const assessorEnabled = wf.assessors.length > 0;

  // 缓存关闭前的配置，再次启用时恢复
  const cachedApproversRef = useRef<WorkflowApprover[] | null>(null);
  const cachedAssessorsRef = useRef<WorkflowApprover[] | null>(null);
  const cachedAssessmentRef = useRef<{ value?: AssessmentModel; complexity?: AssessmentModel } | null>(null);
  if (approverEnabled) cachedApproversRef.current = wf.approvers;
  if (assessorEnabled) {
    cachedAssessorsRef.current = wf.assessors;
    cachedAssessmentRef.current = { value: valueModel, complexity: complexityModel };
  }

  const computeTemplate = (approvers: WorkflowApprover[], assessors: WorkflowApprover[]): WorkflowConfig['template'] =>
    approvers.length === 0 && assessors.length === 0 ? 'none' : 'simple';

  const updateLists = (approvers: WorkflowApprover[], assessors: WorkflowApprover[]) => {
    onChange({ ...wf, template: computeTemplate(approvers, assessors), approvers, assessors });
  };

  const handleToggleApprover = (next: boolean) => {
    if (next) {
      const restored = cachedApproversRef.current && cachedApproversRef.current.length > 0
        ? cachedApproversRef.current
        : buildWorkflowFromTemplate('simple').approvers;
      updateLists(restored, wf.assessors);
      Toast.success('已启用审批人配置');
    } else {
      cachedApproversRef.current = wf.approvers;
      updateLists([], wf.assessors);
      Toast.success('已关闭审批人配置');
    }
  };

  const handleToggleAssessor = (next: boolean) => {
    if (next) {
      const restored = cachedAssessorsRef.current && cachedAssessorsRef.current.length > 0
        ? cachedAssessorsRef.current
        : buildWorkflowFromTemplate('assess-first').assessors;
      updateLists(wf.approvers, restored);
      const cachedAssess = cachedAssessmentRef.current;
      if (cachedAssess && onChangeAssessment) {
        onChangeAssessment(cachedAssess.value, cachedAssess.complexity);
      }
      Toast.success('已启用评估人配置');
    } else {
      cachedAssessorsRef.current = wf.assessors;
      cachedAssessmentRef.current = { value: valueModel, complexity: complexityModel };
      updateLists(wf.approvers, []);
      onClearAssessment?.();
      Toast.success('已关闭评估人配置');
    }
  };

  const renderCardHeader = (
    title: string,
    enabled: boolean,
    onToggle: (v: boolean) => void,
    onAdd?: () => void,
  ) => (
    <div className="workflow-card-header">
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong>{title}</Text>
        {enabled
          ? <Tag color="green" type="light" size="small">已启用</Tag>
          : <Tag color="orange" type="light" size="small">已关闭</Tag>}
      </span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {enabled && onAdd && (
          <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={onAdd}>添加</Button>
        )}
        <Switch checked={enabled} onChange={onToggle} />
      </span>
    </div>
  );

  const renderDisabledBody = (hint: string) => (
    <div className="workflow-disabled-empty">
      <div className="icon-wrap">
        <PowerOff size={24} strokeWidth={1.5} />
      </div>
      <Text type="tertiary" size="small" style={{ textAlign: 'center', maxWidth: 420 }}>{hint}</Text>
    </div>
  );

  return (
    <div className="workflow-builder">
      {/* 技术评估人配置卡片 */}
      <div className="workflow-section">
        {renderCardHeader(
          '技术评估人配置',
          assessorEnabled,
          handleToggleAssessor,
          () => updateLists(wf.approvers, [...wf.assessors, makeApprover(wf.assessors.length + 1)]),
        )}
        {assessorEnabled ? (
          <ApproverList
            list={wf.assessors}
            emptyHint="暂无评估级，点击右上角添加"
            onChange={(list) => updateLists(wf.approvers, list)}
          />
        ) : (
          renderDisabledBody('已关闭评估人配置，需求将不进行技术评估。开启后可配置评估人及评估模型。')
        )}

        {/* 评估模型配置：仅在评估人启用时紧贴展示 */}
        {assessorEnabled && onChangeAssessment && (
          <div className="workflow-assessment-embed">
            <AssessmentBuilder
              valueModel={valueModel}
              complexityModel={complexityModel}
              fields={fields}
              onChange={onChangeAssessment}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
