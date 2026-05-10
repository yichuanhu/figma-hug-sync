import { useRef, useState } from 'react';
import { Input, Button, Switch, Tooltip, Tag } from '@douyinfe/semi-ui';
import {
  GripHorizontal,
  Settings2,
  Trash2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import type { SchemeField } from '@/pages/Requirements/RequirementsWorkbench/types';
import FieldConfigPanel from '../FieldConfigPanel';

interface Props {
  index: number;
  number: number;
  field: SchemeField;
  selected: boolean;
  allFields: SchemeField[];
  onSelect: () => void;
  onPatch: (patch: Partial<SchemeField>) => void;
  onSubmit: (next: SchemeField) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** 拖拽 */
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  draggingIndex: number | null;
  overIndex: number | null;
}

/** 根据字段类型渲染只读预览（飞书问卷风格） */
const renderPreview = (f: SchemeField) => {
  switch (f.type) {
    case 'text':
      return <div className="preview-input single">{f.placeholder || '待填写者输入'}</div>;
    case 'textarea':
    case 'rich_text':
      return <div className="preview-input multi">{f.placeholder || '待填写者输入'}</div>;
    case 'number':
    case 'percentage':
      return (
        <div className="preview-input single">
          {f.placeholder || '请输入数字'}{f.unit ? ` (${f.unit})` : ''}
        </div>
      );
    case 'date':
      return <div className="preview-input single">年 / 月 / 日</div>;
    case 'file_upload':
      return <div className="preview-upload">点击或拖拽文件到此区域</div>;
    case 'calculation':
      return <div className="preview-input single calc">自动计算：{f.expression || '未配置表达式'}</div>;
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
    case 'radio':
    case 'select':
    case 'multi_select':
    case 'checkbox_group': {
      const isSquare = f.type === 'checkbox_group' || f.type === 'multi_select';
      const opts = f.options ?? [];
      if (opts.length === 0) {
        return <div className="preview-empty">未配置选项</div>;
      }
      return (
        <div className="preview-options">
          {opts.map((o, i) => (
            <label key={i} className="preview-option">
              <span className={`opt-box ${isSquare ? 'square' : 'round'}`} />
              <span>{o.label || '请输入选项'}</span>
            </label>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
};

const FieldCard = ({
  index,
  number,
  field,
  selected,
  allFields,
  onSelect,
  onPatch,
  onSubmit,
  onDuplicate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingIndex,
  overIndex,
}: Props) => {
  const [showConfig, setShowConfig] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = draggingIndex === index;
  const isOver = overIndex === index && draggingIndex !== index;

  return (
    <div
      ref={cardRef}
      className={`field-card${selected ? ' selected' : ''}${isDragging ? ' is-dragging' : ''}${isOver ? ' is-over' : ''}`}
      onClick={onSelect}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* 顶部拖拽条（hover 显示） */}
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
          {field.required && <Tag color="red" type="light" size="small">必填</Tag>}
          {field.depends_on && <Tag color="purple" type="light" size="small">依赖</Tag>}
        </div>

        <Input
          className="card-desc-input"
          value={field.description}
          onChange={(v) => onPatch({ description: v })}
          placeholder="问题描述（可选）"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="card-preview">{renderPreview(field)}</div>
      </div>

      {/* 右上角操作 */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <Tooltip content="必填">
          <Switch size="small" checked={!!field.required} onChange={(v) => onPatch({ required: v })} />
        </Tooltip>
        <Tooltip content="配置">
          <Button
            icon={<Settings2 size={14} strokeWidth={2} />}
            theme={showConfig ? 'light' : 'borderless'}
            type="tertiary"
            size="small"
            onClick={() => setShowConfig((s) => !s)}
          />
        </Tooltip>
        <Tooltip content="复制">
          <Button icon={<Copy size={14} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onDuplicate} />
        </Tooltip>
        <Tooltip content="删除">
          <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={onRemove} />
        </Tooltip>
      </div>

      {/* 内联配置面板 */}
      {showConfig && (
        <div className="card-config-inline" onClick={(e) => e.stopPropagation()}>
          <FieldConfigPanel
            field={field}
            index={index}
            allFields={allFields}
            onSubmit={(next) => {
              onSubmit(next);
              setShowConfig(false);
            }}
            onCancel={() => setShowConfig(false)}
          />
        </div>
      )}
    </div>
  );
};

export default FieldCard;
