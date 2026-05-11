/**
 * 审批人/评估人配置卡片
 *
 * 完整复用「需求模版 → 工作流」中的 ApproverList 卡片样式与交互
 * （drag 排序、Tag 优先级、类型/模式/必需开关、启用开关、关闭空态），
 * 通过 props 复用为「审批人配置」与「技术评估人配置」两张卡片。
 */
import { ReactNode, useRef, useState } from 'react';
import { Button, Select, Typography, Empty, Input, Switch, Tag, Toast } from '@douyinfe/semi-ui';
import { Plus, Trash2, GripVertical, PowerOff } from 'lucide-react';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import type {
  WorkflowApprover,
  WorkflowApproverType,
  WorkflowApprovalMode,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

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

const makeApprover = (priority: number, defaultName: string): WorkflowApprover => ({
  id: `appr-${Date.now().toString(36).slice(-4)}-${priority}`,
  name: defaultName,
  type: 'department_leader',
  priority,
  required: true,
  approval_mode: 'any_one',
  timeout_days: 7,
});

interface Props {
  title: string;
  approvers: WorkflowApprover[];
  onChange: (next: WorkflowApprover[]) => void;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  emptyHint: string;
  disabledHint: string;
  enableToastText?: string;
  disableToastText?: string;
  defaultItemName?: string;
  /** 启用时卡片底部嵌入的额外内容（如评估模型配置） */
  extra?: ReactNode;
}

const ApproverListEditor = ({
  title,
  approvers,
  onChange,
  enabled,
  onToggle,
  emptyHint,
  disabledHint,
  enableToastText,
  disableToastText,
  defaultItemName = '新审批级',
  extra,
}: Props) => {
  const update = (idx: number, p: WorkflowApprover) =>
    onChange(approvers.map((x, i) => (i === idx ? p : x)));
  const remove = (idx: number) => {
    const next = approvers.filter((_, i) => i !== idx);
    next.forEach((x, i) => (x.priority = i + 1));
    onChange(next);
  };
  const add = () => onChange([...approvers, makeApprover(approvers.length + 1, defaultItemName)]);

  const cachedRef = useRef<WorkflowApprover[] | null>(null);
  if (enabled && approvers.length > 0) cachedRef.current = approvers;

  const handleToggle = (next: boolean) => {
    if (next) {
      const restored = cachedRef.current && cachedRef.current.length > 0
        ? cachedRef.current
        : [makeApprover(1, defaultItemName)];
      onChange(restored);
      onToggle(true);
      if (enableToastText) Toast.success(enableToastText);
    } else {
      cachedRef.current = approvers;
      onChange([]);
      onToggle(false);
      if (disableToastText) Toast.success(disableToastText);
    }
  };

  const dragIndexRef = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= approvers.length || to >= approvers.length) return;
    const next = [...approvers];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    next.forEach((x, i) => (x.priority = i + 1));
    onChange(next);
  };

  return (
    <div className="workflow-section">
      <div className="workflow-card-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>{title}</Text>
          {enabled
            ? <Tag color="green" type="light" size="small">已启用</Tag>
            : <Tag color="orange" type="light" size="small">已关闭</Tag>}
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {enabled && (
            <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={add}>
              添加
            </Button>
          )}
          <Switch checked={enabled} onChange={handleToggle} />
        </span>
      </div>

      {enabled ? (
        approvers.length === 0 ? (
          <Empty description={emptyHint} style={{ padding: '24px 0' }} />
        ) : (
          approvers.map((a, idx) => (
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
                <Input
                  value={a.name}
                  onChange={(v) => update(idx, { ...a, name: v })}
                  placeholder="名称"
                  size="small"
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Select
                    value={a.type}
                    onChange={(v) => update(idx, { ...a, type: v as WorkflowApproverType })}
                    optionList={APPROVER_TYPE_OPTIONS}
                    size="small"
                    style={{ width: 120 }}
                  />
                  <Select
                    value={a.approval_mode ?? 'any_one'}
                    onChange={(v) => update(idx, { ...a, approval_mode: v as WorkflowApprovalMode })}
                    optionList={MODE_OPTIONS}
                    size="small"
                    style={{ width: 120 }}
                  />
                  <Switch checked={a.required} onChange={(v) => update(idx, { ...a, required: v })} size="small" />
                  <Text size="small" type="tertiary">必需</Text>
                </div>
                {a.type === 'specific_users' && (
                  <OwnerSearchSelect
                    multiple
                    size="small"
                    value={a.target_ids ?? []}
                    onChange={(v: string | string[]) =>
                      update(idx, { ...a, target_ids: (Array.isArray(v) ? v : []) as string[] })
                    }
                    placeholder="搜索并选择用户"
                  />
                )}
                {a.type === 'role' && (
                  <Select
                    multiple
                    value={a.target_ids ?? []}
                    onChange={(v) => update(idx, { ...a, target_ids: v as string[] })}
                    optionList={ROLE_OPTIONS}
                    size="small"
                    placeholder="选择角色"
                  />
                )}
              </div>
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                theme="borderless"
                type="danger"
                size="small"
                onClick={() => remove(idx)}
              />
            </div>
          ))
        )
      ) : (
        <div className="workflow-disabled-empty">
          <div className="icon-wrap">
            <PowerOff size={24} strokeWidth={1.5} />
          </div>
          <Text type="tertiary" size="small" style={{ textAlign: 'center', maxWidth: 420 }}>
            {disabledHint}
          </Text>
        </div>
      )}

      {enabled && extra && <div className="workflow-assessment-embed">{extra}</div>}
    </div>
  );
};

export default ApproverListEditor;
