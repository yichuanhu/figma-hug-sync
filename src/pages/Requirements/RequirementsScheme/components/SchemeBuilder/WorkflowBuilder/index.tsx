import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Typography, Empty, Input, Switch, Tag, Toast, Modal } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown, Workflow as WorkflowIcon, PowerOff } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { buildWorkflowFromTemplate } from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import AssessmentBuilder from '../AssessmentBuilder';
import type {
  WorkflowConfig,
  WorkflowApprover,
  WorkflowApproverType,
  WorkflowApprovalMode,
  WorkflowState,
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

const TEMPLATES = [
  { value: 'simple', label: '简单审批' },
  { value: 'multi-approval', label: '多级审批' },
  { value: 'assess-first', label: '评估优先' },
  { value: 'multi-approval-assess', label: '多级审批 + 评估' },
];

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

const layoutStates = (states: WorkflowState[]): Node[] =>
  states.map((s, i) => ({
    id: s.id,
    data: { label: s.name + (s.initial ? ' (起)' : '') },
    position: { x: 60 + (i % 4) * 180, y: 60 + Math.floor(i / 4) * 120 },
    style: {
      background: s.role === 'approval' ? '#E6F4FF' : s.role === 'assessment' ? '#FFF7E6' : '#fff',
      border: '1px solid var(--semi-color-border)',
      padding: '8px 14px',
      borderRadius: 6,
      fontSize: 12,
    },
  }));

const buildEdges = (states: WorkflowState[]): Edge[] => {
  const edges: Edge[] = [];
  states.forEach((s) => {
    s.transitions.forEach((tr) => {
      edges.push({
        id: `${s.id}-${tr.id}`,
        source: s.id,
        target: tr.to,
        label: tr.label,
        labelStyle: { fontSize: 11 },
        style: { stroke: 'var(--semi-color-border)' },
        animated: false,
      });
    });
  });
  return edges;
};

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

const WorkflowBuilder = ({ workflow, onChange, onClearAssessment }: Props) => {
  const { t } = useTranslation();
  const wf: WorkflowConfig = workflow ?? { template: 'simple', states: [], approvers: [], assessors: [] };
  const disabled = wf.template === 'none';

  const nodes = useMemo(() => layoutStates(wf.states), [wf.states]);
  const edges = useMemo(() => buildEdges(wf.states), [wf.states]);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);
  useEffect(() => { setRfNodes(nodes); setRfEdges(edges); }, [nodes, edges, setRfNodes, setRfEdges]);

  const handleApplyTemplate = (tpl: string) => {
    const next = buildWorkflowFromTemplate(tpl);
    onChange(next);
    Toast.success('已加载模板');
  };

  const handleToggle = (next: boolean) => {
    if (next) {
      // 启用：加载默认模板
      onChange(buildWorkflowFromTemplate('simple'));
      Toast.success('已启用审批流');
      return;
    }
    // 关闭前确认
    Modal.confirm({
      title: '关闭审批流',
      content: '关闭后将清空已配置的审批人、评估人与评估模型。提交此模版的需求将跳过审批与评估，直接进入「待立项」。是否继续？',
      okText: '关闭审批流',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      onOk: () => {
        onChange(DISABLED_WORKFLOW);
        onClearAssessment?.();
        Toast.success('已关闭审批流');
      },
    });
  };

  return (
    <div className="workflow-builder">
      <div className="workflow-preview-card">
        <div className="scheme-builder-section-title">
          <span className="title">
            <WorkflowIcon size={14} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
            {t('requirements.scheme.builder.workflow.title')}
            {disabled
              ? <Tag color="orange" type="light" size="small" style={{ marginLeft: 8 }}>无审批流</Tag>
              : <Tag color="grey" type="light" size="small" style={{ marginLeft: 8 }}>预览</Tag>}
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {!disabled && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Text type="tertiary" size="small">工作流模板</Text>
                <Select value={wf.template} onChange={(v) => handleApplyTemplate(v as string)}
                  placeholder="选择模板" optionList={TEMPLATES} style={{ width: 200 }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Text type="tertiary" size="small">启用审批流</Text>
              <Switch checked={!disabled} onChange={handleToggle} />
            </div>
          </div>
        </div>

        {disabled ? (
          <div className="workflow-disabled-empty">
            <div className="icon-wrap">
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
            <div className="workflow-canvas">
              {wf.states.length === 0 ? (
                <Empty description="请先选择模板加载工作流" style={{ paddingTop: 100 }} />
              ) : (
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background />
                  <Controls showInteractive={false} />
                  <MiniMap pannable />
                </ReactFlow>
              )}
            </div>
            <Text type="tertiary" size="small" style={{ marginTop: 8, display: 'block' }}>
              状态流转由所选模板决定，仅用于预览。如需调整流程，请切换模板。
            </Text>
          </>
        )}
      </div>

      {!disabled && (
        <div className="workflow-config-grid">
          <ApproverList
            title="审批人配置"
            emptyHint="暂无审批级，点击右上角添加"
            list={wf.approvers}
            onChange={(list) => onChange({ ...wf, approvers: list })}
          />
          <ApproverList
            title="评估人配置"
            emptyHint="暂无评估级，点击右上角添加"
            list={wf.assessors}
            onChange={(list) => onChange({ ...wf, assessors: list })}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
