import { useRef, useState } from 'react';
import { Input, Button, Switch, Tooltip, Tag } from '@douyinfe/semi-ui';
import {
  GripHorizontal,
  Settings2,
  Trash2,
  Copy,
  ArrowRight,
  Plus,
  GripVertical,
  X,
} from 'lucide-react';
import type {
  SchemeField,
  SchemeFieldOption,
} from '@/pages/Requirements/RequirementsWorkbench/types';

interface Props {
  index: number;
  number: number;
  field: SchemeField;
  selected: boolean;
  hasError?: boolean;
  allFields: SchemeField[];
  onSelect: () => void;
  onPatch: (patch: Partial<SchemeField>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** 卡片整体拖拽 */
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  draggingIndex: number | null;
  overIndex: number | null;
}

const HAS_OPTIONS = ['select', 'multi_select', 'radio', 'checkbox_group'] as const;
type WithOptionsType = (typeof HAS_OPTIONS)[number];
const isOptionType = (t: string): t is WithOptionsType =>
  (HAS_OPTIONS as readonly string[]).includes(t);

/** 选项类字段：行内增删改 + 拖拽 + 键盘快捷键 */
const OptionsEditor = ({
  field,
  onPatch,
}: {
  field: SchemeField;
  onPatch: (p: Partial<SchemeField>) => void;
}) => {
  const isSquare = field.type === 'checkbox_group' || field.type === 'multi_select';
  const options = field.options ?? [];
  const [optDragIdx, setOptDragIdx] = useState<number | null>(null);
  const [optOverIdx, setOptOverIdx] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasOther = options.some((o) => o.isOther);

  const update = (next: SchemeFieldOption[]) => onPatch({ options: next });

  const handleAdd = (asOther = false) => {
    const n = options.length + 1;
    const newOpt: SchemeFieldOption = asOther
      ? { label: '其他', value: '__other__', isOther: true }
      : { label: `选项${n}`, value: `option_${n}` };
    const next = [...options, newOpt];
    update(next);
    // 自动 focus 新行
    setTimeout(() => inputRefs.current[next.length - 1]?.focus(), 0);
  };

  const handleRemove = (i: number) => {
    if (options.length <= 1) return;
    update(options.filter((_, idx) => idx !== i));
  };

  const handleLabelChange = (i: number, label: string) => {
    update(options.map((o, idx) => (idx === i ? { ...o, label } : o)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(false);
    } else if (e.key === 'Backspace' && options[i].label === '' && options.length > 1) {
      e.preventDefault();
      const prev = i - 1;
      handleRemove(i);
      setTimeout(() => inputRefs.current[Math.max(0, prev)]?.focus(), 0);
    }
  };

  // 选项拖拽
  const onOptDragStart = (e: React.DragEvent, i: number) => {
    e.stopPropagation();
    setOptDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onOptDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (optDragIdx === null) return;
    setOptOverIdx(i);
  };
  const onOptDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (optDragIdx === null || optDragIdx === i) {
      setOptDragIdx(null);
      setOptOverIdx(null);
      return;
    }
    const next = [...options];
    const [moved] = next.splice(optDragIdx, 1);
    next.splice(i, 0, moved);
    update(next);
    setOptDragIdx(null);
    setOptOverIdx(null);
  };
  const onOptDragEnd = () => {
    setOptDragIdx(null);
    setOptOverIdx(null);
  };

  if (options.length === 0) {
    return (
      <div className="opts-editor">
        <Button
          icon={<Plus size={14} strokeWidth={2} />}
          theme="borderless"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleAdd(false);
          }}
        >
          添加选项
        </Button>
      </div>
    );
  }

  return (
    <div className="opts-editor" onClick={(e) => e.stopPropagation()}>
      {options.map((opt, i) => (
        <div
          key={i}
          className={`opt-row${optDragIdx === i ? ' dragging' : ''}${
            optOverIdx === i && optDragIdx !== i ? ' over' : ''
          }`}
          onDragOver={(e) => onOptDragOver(e, i)}
          onDrop={(e) => onOptDrop(e, i)}
        >
          <span
            className="opt-handle"
            draggable
            onDragStart={(e) => onOptDragStart(e, i)}
            onDragEnd={onOptDragEnd}
            title="拖拽排序"
          >
            <GripVertical size={14} strokeWidth={2} />
          </span>
          <span className={`opt-box ${isSquare ? 'square' : 'round'}`} />
          <Input
            ref={(el) => {
              const inputEl =
                ((el as unknown as { inputRef?: { current?: HTMLInputElement } })?.inputRef
                  ?.current as HTMLInputElement | undefined) ??
                ((el as unknown as HTMLInputElement | null) ?? null);
              inputRefs.current[i] = inputEl ?? null;
            }}
            value={opt.label}
            onChange={(val) => handleLabelChange(i, val)}
            onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, i)}
            placeholder="请输入选项"
            className="opt-input"
          />
          {opt.isOther && (
            <Tag size="small" color="orange" type="light">
              其他
            </Tag>
          )}
          <Button
            icon={<X size={14} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            disabled={options.length <= 1}
            onClick={() => handleRemove(i)}
            className="opt-remove"
          />
        </div>
      ))}
      <div className="opt-actions">
        <Button
          icon={<Plus size={14} strokeWidth={2} />}
          theme="borderless"
          size="small"
          onClick={() => handleAdd(false)}
        >
          添加选项
        </Button>
        <Button
          icon={<Plus size={14} strokeWidth={2} />}
          theme="borderless"
          size="small"
          disabled={hasOther}
          onClick={() => handleAdd(true)}
        >
          添加&ldquo;其他&rdquo;
        </Button>
      </div>
    </div>
  );
};

/** 根据字段类型渲染预览（飞书问卷风格，部分类型支持行内编辑） */
const renderPreview = (
  f: SchemeField,
  onPatch: (p: Partial<SchemeField>) => void,
) => {
  switch (f.type) {
    case 'text':
      return (
        <Input
          value={f.placeholder ?? ''}
          onChange={(v) => onPatch({ placeholder: v })}
          placeholder="待填写者输入..."
          onClick={(e) => e.stopPropagation()}
        />
      );
    case 'textarea':
    case 'rich_text':
      return (
        <Input
          value={f.placeholder ?? ''}
          onChange={(v) => onPatch({ placeholder: v })}
          placeholder="待填写者输入..."
          onClick={(e) => e.stopPropagation()}
        />
      );
    case 'number':
    case 'percentage':
      return (
        <div
          className="preview-number-row"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={f.placeholder ?? ''}
            onChange={(v) => onPatch({ placeholder: v })}
            placeholder="占位提示，如 请输入数字"
            style={{ flex: 1 }}
          />
          <Input
            value={f.unit ?? ''}
            onChange={(v) => onPatch({ unit: v })}
            placeholder="单位"
            style={{ width: 100 }}
          />
        </div>
      );
    case 'date':
      return <div className="preview-input single">年 / 月 / 日</div>;
    case 'file_upload':
      return <div className="preview-upload">点击或拖拽文件到此区域</div>;
    case 'calculation':
      return (
        <Input
          value={f.expression ?? ''}
          onChange={(v) => onPatch({ expression: v })}
          placeholder="表达式，如 {a} * {b} / 60"
          onClick={(e) => e.stopPropagation()}
        />
      );
    case 'user_select':
      return <div className="preview-input single">请选择用户</div>;
    case 'department_select':
      return <div className="preview-input single">请选择部门</div>;
    case 'checkbox':
      return (
        <label className="preview-option">
          <span className="opt-box square" />
          <span>{f.label}</span>
        </label>
      );
    default:
      if (isOptionType(f.type)) {
        return <OptionsEditor field={f} onPatch={onPatch} />;
      }
      return null;
  }
};

const FieldCard = ({
  index,
  number,
  field,
  selected,
  hasError,
  allFields,
  onSelect,
  onPatch,
  onDuplicate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingIndex,
  overIndex,
}: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = draggingIndex === index;
  const isOver = overIndex === index && draggingIndex !== index;

  return (
    <div
      ref={cardRef}
      className={`field-card${selected ? ' selected' : ''}${isDragging ? ' is-dragging' : ''}${
        isOver ? ' is-over' : ''
      }${hasError ? ' has-error' : ''}`}
      onClick={onSelect}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      <div
        className="card-drag-bar"
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onClick={(e) => e.stopPropagation()}
        title="拖拽排序"
      >
        <GripHorizontal size={14} strokeWidth={2} />
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <span className="card-number">
            {number}
            <ArrowRight size={12} strokeWidth={2.5} />
          </span>
          <Input
            className="card-title-input"
            value={field.label}
            onChange={(v) => onPatch({ label: v })}
            placeholder="未命名题目"
            onClick={(e) => e.stopPropagation()}
          />
          {field.required && (
            <Tag color="red" type="light" size="small">
              必填
            </Tag>
          )}
          {field.depends_on && (
            <Tag color="purple" type="light" size="small">
              依赖
            </Tag>
          )}
          {hasError && (
            <Tag color="red" size="small">
              配置错误
            </Tag>
          )}
        </div>

        <Input
          className="card-desc-input"
          value={field.description ?? ''}
          onChange={(v) => onPatch({ description: v })}
          placeholder="问题描述（可选）"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="card-preview">{renderPreview(field, onPatch)}</div>
      </div>

      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <Tooltip content="必填">
          <Switch
            size="small"
            checked={!!field.required}
            onChange={(v) => onPatch({ required: v })}
          />
        </Tooltip>
        <Tooltip content="高级配置">
          <Button
            icon={<Settings2 size={14} strokeWidth={2} />}
            theme={selected ? 'light' : 'borderless'}
            type={hasError ? 'danger' : selected ? 'primary' : 'tertiary'}
            size="small"
            onClick={onSelect}
          />
        </Tooltip>
        <Tooltip content="复制">
          <Button
            icon={<Copy size={14} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={onDuplicate}
          />
        </Tooltip>
        <Tooltip content="删除">
          <Button
            icon={<Trash2 size={14} strokeWidth={2} />}
            theme="borderless"
            type="danger"
            size="small"
            onClick={onRemove}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default FieldCard;
