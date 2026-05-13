/**
 * 审批层级列表编辑器
 *
 * - 串行优先级（拖拽排序）
 * - 直接选择审批人
 * - 模式：任一通过 / 会签 / 多数通过
 */
import { useRef, useState } from 'react';
import { Button, Input, InputNumber, Select, Switch, Tag, Typography, Empty } from '@douyinfe/semi-ui';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import type { ApprovalLevel, ApprovalMode } from '../../mockData';

const { Text } = Typography;

const MODE_OPTIONS: Array<{ value: ApprovalMode; label: string }> = [
  { value: 'any_one', label: '任一通过' },
  { value: 'all', label: '会签（全部通过）' },
  { value: 'majority', label: '多数通过' },
];

interface Props {
  levels: ApprovalLevel[];
  onChange: (next: ApprovalLevel[]) => void;
  disabled?: boolean;
}

const ApprovalLevelList = ({ levels, onChange, disabled }: Props) => {
  const dragIndexRef = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<ApprovalLevel>) => {
    onChange(levels.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const remove = (idx: number) => {
    const next = levels.filter((_, i) => i !== idx).map((x, i) => ({ ...x, priority: i + 1 }));
    onChange(next);
  };

  const add = () => {
    onChange([
      ...levels,
      {
        id: `lv-${Date.now().toString(36)}`,
        name: `审批层级 ${levels.length + 1}`,
        user_ids: [],
        mode: 'any_one',
        priority: levels.length + 1,
        required: true,
        timeout_days: 3,
      },
    ]);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...levels];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((x, i) => ({ ...x, priority: i + 1 })));
  };

  return (
    <div className="approval-level-list">
      <div className="section-header">
        <Text strong>审批层级（按优先级串行）</Text>
        {!disabled && (
          <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={add}>
            添加层级
          </Button>
        )}
      </div>

      {levels.length === 0 ? (
        <Empty description="暂无审批层级，点击「添加层级」开始配置" style={{ padding: '24px 0' }} />
      ) : (
        levels.map((lv, idx) => (
          <div
            key={lv.id}
            className={`level-row${dragIdx === idx ? ' is-dragging' : ''}${
              overIdx === idx && dragIdx !== idx ? ' is-over' : ''
            }`}
            onDragOver={(e) => {
              if (disabled || dragIndexRef.current === null) return;
              e.preventDefault();
              if (overIdx !== idx) setOverIdx(idx);
            }}
            onDrop={(e) => {
              if (disabled) return;
              e.preventDefault();
              const from = dragIndexRef.current;
              if (from !== null) reorder(from, idx);
              dragIndexRef.current = null;
              setDragIdx(null);
              setOverIdx(null);
            }}
          >
            {!disabled && (
              <span
                className="drag-handle"
                draggable
                onDragStart={(e) => {
                  dragIndexRef.current = idx;
                  setDragIdx(idx);
                  e.dataTransfer.effectAllowed = 'move';
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
            )}
            <Tag color="blue" type="light" size="small">P{lv.priority}</Tag>
            <div className="level-row-body">
              <Input
                value={lv.name}
                onChange={(v) => update(idx, { name: v })}
                placeholder="层级名称"
                size="small"
                disabled={disabled}
                maxLength={50}
              />
              <div className="level-row-inline">
                <Select
                  value={lv.mode}
                  onChange={(v) => update(idx, { mode: v as ApprovalMode })}
                  optionList={MODE_OPTIONS}
                  size="small"
                  style={{ width: 150 }}
                  disabled={disabled}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text size="small" type="tertiary">超时</Text>
                  <InputNumber
                    value={lv.timeout_days}
                    onChange={(v) => update(idx, { timeout_days: typeof v === 'number' ? v : undefined })}
                    min={1}
                    max={90}
                    size="small"
                    style={{ width: 80 }}
                    disabled={disabled}
                    suffix="天"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Switch
                    checked={lv.required}
                    onChange={(v) => update(idx, { required: v })}
                    size="small"
                    disabled={disabled}
                  />
                  <Text size="small" type="tertiary">必需</Text>
                </div>
              </div>
              <OwnerSearchSelect
                multiple
                size="small"
                value={lv.user_ids ?? []}
                onChange={(v: string | string[]) =>
                  update(idx, { user_ids: Array.isArray(v) ? v : [] })
                }
                placeholder="搜索并选择审批人"
                disabled={disabled}
              />
            </div>
            {!disabled && (
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                theme="borderless"
                type="danger"
                size="small"
                onClick={() => remove(idx)}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ApprovalLevelList;
