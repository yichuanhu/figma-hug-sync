import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag } from '@douyinfe/semi-ui';
import { Lock, AlertTriangle } from 'lucide-react';
import type { SchemeField, SchemeFieldType } from '@/pages/Requirements/RequirementsWorkbench/types';
import FieldCard from './FieldCard';
import AddFieldPopover from './AddFieldPopover';
import { validateAllFields } from './validators';

const { Text } = Typography;

interface Props {
  fields: SchemeField[];
  onChange: (fields: SchemeField[]) => void;
}

const SYSTEM_FIELDS: Array<{ key: string; label: string; type: string }> = [
  { key: 'title', label: '标题', type: 'text' },
  { key: 'number', label: '编号', type: '自动生成' },
  { key: 'department_id', label: '所属部门', type: 'department_select' },
  { key: 'owner_id', label: '所属用户', type: 'user_select' },
  { key: 'status', label: '状态', type: '系统' },
];

const TYPE_LABEL_KEY: Record<SchemeFieldType, string> = {
  text: 'requirements.scheme.builder.fieldType.text',
  textarea: 'requirements.scheme.builder.fieldType.textarea',
  number: 'requirements.scheme.builder.fieldType.number',
  percentage: 'requirements.scheme.builder.fieldType.percentage',
  select: 'requirements.scheme.builder.fieldType.select',
  multi_select: 'requirements.scheme.builder.fieldType.multi_select',
  radio: 'requirements.scheme.builder.fieldType.radio',
  checkbox: 'requirements.scheme.builder.fieldType.checkbox',
  checkbox_group: 'requirements.scheme.builder.fieldType.checkbox_group',
  date: 'requirements.scheme.builder.fieldType.date',
  file_upload: 'requirements.scheme.builder.fieldType.file_upload',
  rich_text: 'requirements.scheme.builder.fieldType.rich_text',
  calculation: 'requirements.scheme.builder.fieldType.calculation',
  user_select: 'requirements.scheme.builder.fieldType.text',
  department_select: 'requirements.scheme.builder.fieldType.text',
};

const FormBuilder = ({ fields, onChange }: Props) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const addField = (type: SchemeFieldType) => {
    const baseKey = `field_${type}_${Date.now().toString(36).slice(-4)}`;
    const labelKey = TYPE_LABEL_KEY[type] ?? 'requirements.scheme.builder.fieldType.text';
    const newField: SchemeField = {
      key: baseKey,
      label: `${t(labelKey)}`,
      type,
      required: false,
      ui_width: 'full',
    };
    if (['select', 'multi_select', 'radio', 'checkbox_group'].includes(type)) {
      newField.options = [
        { label: '选项1', value: 'option1' },
        { label: '选项2', value: 'option2' },
        { label: '选项3', value: 'option3' },
      ];
    }
    const next = [...fields, newField];
    onChange(next);
    setSelectedIndex(next.length - 1);
  };

  const patchField = (index: number, patch: Partial<SchemeField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const duplicateField = (index: number) => {
    const f = fields[index];
    const copy: SchemeField = {
      ...f,
      key: `${f.key}_copy_${Date.now().toString(36).slice(-3)}`,
      label: `${f.label} 副本`,
    };
    const next = [...fields.slice(0, index + 1), copy, ...fields.slice(index + 1)];
    onChange(next);
    setSelectedIndex(index + 1);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex !== null && selectedIndex > index) setSelectedIndex(selectedIndex - 1);
  };

  // ============= 校验 =============
  const validation = useMemo(() => validateAllFields(fields), [fields]);
  const errorKeySet = useMemo(() => new Set(validation.errorFieldKeys), [validation]);

  // ============= 拖拽排序 =============
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null) return;
    setOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) {
      setDraggingIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...fields];
    const [moved] = next.splice(draggingIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    if (selectedIndex === draggingIndex) setSelectedIndex(index);
    setDraggingIndex(null);
    setOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="form-builder scheme-builder-pane">
      <div className="form-canvas-wide">
        {/* 系统字段（锁定） */}
        <div className="canvas-section">
          <div className="canvas-section-title">{t('requirements.scheme.builder.systemFields')}</div>
          <div className="system-field-list">
            {SYSTEM_FIELDS.map((sf) => (
              <div key={sf.key} className="system-field-row">
                <Lock size={13} strokeWidth={2} />
                <span className="sf-label">{sf.label}</span>
                <Text type="tertiary" size="small">({sf.key})</Text>
                <Tag color="grey" size="small">{sf.type}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* 校验汇总条 */}
        {validation.hasError && (
          <div className="form-builder-error-banner">
            <AlertTriangle size={14} strokeWidth={2} />
            <span>当前有 {validation.errorFieldKeys.length} 个字段配置存在问题，请展开「高级配置」修正</span>
          </div>
        )}

        {/* 自定义字段 */}
        <div className="canvas-section">
          <div className="canvas-section-title">
            {t('requirements.scheme.builder.customFields')} ({fields.length})
          </div>
          {fields.length === 0 ? (
            <div className="empty-fields">
              <Text type="tertiary" size="small">{t('requirements.scheme.builder.emptyFields')}</Text>
            </div>
          ) : (
            <div className="field-card-list">
              {fields.map((f, idx) => (
                <FieldCard
                  key={`${f.key}-${idx}`}
                  index={idx}
                  number={idx + 1}
                  field={f}
                  selected={selectedIndex === idx}
                  hasError={errorKeySet.has(f.key)}
                  allFields={fields}
                  onSelect={() => setSelectedIndex(idx)}
                  onPatch={(patch) => patchField(idx, patch)}
                  onDuplicate={() => duplicateField(idx)}
                  onRemove={() => removeField(idx)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  draggingIndex={draggingIndex}
                  overIndex={overIndex}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部添加题目按钮 */}
        <div className="add-field-bar">
          <AddFieldPopover onAdd={addField} />
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
