import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Typography, Empty, Input, InputNumber, Switch, Tag, Toast } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
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
import type {
  WorkflowConfig,
  WorkflowApprover,
  WorkflowApproverType,
  WorkflowApprovalMode,
  WorkflowState,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

interface Props {
  workflow?: WorkflowConfig;
  onChange: (wf: WorkflowConfig) => void;
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

// 状态名 -> 节点位置（按层级布局）
const layoutStates = (states: WorkflowState[]): Node[] => {
  return states.map((s, i) => ({
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
};

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
  list,
  onChange,
}: {
  title: string;
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
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text strong style={{ fontSize: 12 }}>{title}</Text>
        <Button icon={<Plus size={12} strokeWidth={2} />} size="small" theme="borderless" onClick={add}>添加</Button>
      </div>
      {list.length === 0 && <Text type="tertiary" size="small">暂无配置</Text>}
      {list.map((a, idx) => (
        <div key={a.id} className="approver-row">
          <Tag color="blue" type="light" size="small">P{a.priority}</Tag>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input value={a.name} onChange={(v) => update(idx, { ...a, name: v })} placeholder="名称" size="small" />
            <div style={{ display: 'flex', gap: 6 }}>
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
      ))}
    </div>
  );
};

const StateEditor = ({
  state,
  allStates,
  onChange,
  onDelete,
}: {
  state: WorkflowState;
  allStates: WorkflowState[];
  onChange: (s: WorkflowState) => void;
  onDelete: () => void;
}) => {
  const updateTr = (idx: number, p: { to: string; action: string; label: string; auto_assign?: boolean }) => {
    onChange({ ...state, transitions: state.transitions.map((x, i) => i === idx ? { ...x, ...p } : x) });
  };
  const removeTr = (idx: number) => onChange({ ...state, transitions: state.transitions.filter((_, i) => i !== idx) });
  const addTr = () => {
    onChange({
      ...state,
      transitions: [...state.transitions, { id: `tr-${Date.now().toString(36).slice(-3)}`, to: allStates[0]?.id ?? '', action: 'next', label: '下一步' }],
    });
  };

  return (
    <div style={{ background: 'var(--semi-color-fill-0)', borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Input value={state.name} onChange={(v) => onChange({ ...state, name: v })} size="small" style={{ flex: 1 }} />
        <Select value={state.role ?? 'normal'} onChange={(v) => onChange({ ...state, role: v as WorkflowState['role'] })}
          optionList={[{ label: '普通', value: 'normal' }, { label: '审批', value: 'approval' }, { label: '评估', value: 'assessment' }]}
          size="small" style={{ width: 90 }} />
        <Switch checked={!!state.initial} onChange={(v) => onChange({ ...state, initial: v })} size="small" />
        <Text size="small" type="tertiary">起</Text>
        <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={onDelete} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Text type="tertiary" size="small">迁移：</Text>
        {state.transitions.map((tr, i) => (
          <div key={tr.id} style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <Select value={tr.to} onChange={(v) => updateTr(i, { ...tr, to: v as string })}
              optionList={allStates.filter((s) => s.id !== state.id).map((s) => ({ label: s.name, value: s.id }))}
              size="small" style={{ width: 110 }} />
            <Input value={tr.action} onChange={(v) => updateTr(i, { ...tr, action: v })} placeholder="action" size="small" style={{ width: 90 }} />
            <Input value={tr.label} onChange={(v) => updateTr(i, { ...tr, label: v })} placeholder="标签" size="small" style={{ flex: 1 }} />
            <Button icon={<Trash2 size={12} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={() => removeTr(i)} />
          </div>
        ))}
        <Button icon={<Plus size={12} strokeWidth={2} />} theme="borderless" size="small" onClick={addTr} style={{ marginTop: 4 }}>添加迁移</Button>
      </div>
    </div>
  );
};

const WorkflowBuilder = ({ workflow, onChange }: Props) => {
  const { t } = useTranslation();
  const wf: WorkflowConfig = workflow ?? { template: 'simple', states: [], approvers: [], assessors: [] };

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

  const updateState = (idx: number, s: WorkflowState) => {
    onChange({ ...wf, states: wf.states.map((x, i) => i === idx ? s : x) });
  };

  return (
    <div className="workflow-builder">
      <div>
        <div className="scheme-builder-section-title">
          <span className="title">{t('requirements.scheme.builder.workflow.title')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={wf.template} onChange={(v) => handleApplyTemplate(v as string)}
              placeholder="选择模板" optionList={TEMPLATES} style={{ width: 200 }} />
          </div>
        </div>

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
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls showInteractive={false} />
              <MiniMap pannable />
            </ReactFlow>
          )}
        </div>

        {/* 状态列表编辑 */}
        <div style={{ marginTop: 16 }}>
          <div className="scheme-builder-section-title">
            <span className="title">状态与迁移</span>
            <Button icon={<Plus size={14} strokeWidth={2} />} size="small"
              onClick={() => onChange({ ...wf, states: [...wf.states, { id: `s-${Date.now().toString(36).slice(-3)}`, name: '新状态', role: 'normal', transitions: [] }] })}>
              添加状态
            </Button>
          </div>
          {wf.states.map((s, i) => (
            <StateEditor key={s.id} state={s} allStates={wf.states}
              onChange={(ns) => updateState(i, ns)}
              onDelete={() => onChange({ ...wf, states: wf.states.filter((_, idx) => idx !== i) })} />
          ))}
        </div>
      </div>

      <div className="workflow-side">
        <ApproverList title="审批人配置" list={wf.approvers} onChange={(list) => onChange({ ...wf, approvers: list })} />
        <ApproverList title="评估人配置" list={wf.assessors} onChange={(list) => onChange({ ...wf, assessors: list })} />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
