import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tag, Typography, Toast, Tooltip } from '@douyinfe/semi-ui';
import { Lock, Settings2, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import type { SchemeField, SchemeFieldType } from '@/pages/Requirements/RequirementsWorkbench/types';
import FieldConfigPanel from './FieldConfigPanel';

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

const FIELD_TYPES: Array<{ type: SchemeFieldType; labelKey: string }> = [
  { type: 'text', labelKey: 'requirements.scheme.builder.fieldType.text' },
  { type: 'textarea', labelKey: 'requirements.scheme.builder.fieldType.textarea' },
  { type: 'number', labelKey: 'requirements.scheme.builder.fieldType.number' },
  { type: 'percentage', labelKey: 'requirements.scheme.builder.fieldType.percentage' },
  { type: 'select', labelKey: 'requirements.scheme.builder.fieldType.select' },
  { type: 'multi_select', labelKey: 'requirements.scheme.builder.fieldType.multi_select' },
  { type: 'radio', labelKey: 'requirements.scheme.builder.fieldType.radio' },
  { type: 'checkbox', labelKey: 'requirements.scheme.builder.fieldType.checkbox' },
  { type: 'checkbox_group', labelKey: 'requirements.scheme.builder.fieldType.checkbox_group' },
  { type: 'date', labelKey: 'requirements.scheme.builder.fieldType.date' },
  { type: 'file_upload', labelKey: 'requirements.scheme.builder.fieldType.file_upload' },
  { type: 'rich_text', labelKey: 'requirements.scheme.builder.fieldType.rich_text' },
  { type: 'calculation', labelKey: 'requirements.scheme.builder.fieldType.calculation' },
];

const FormBuilder = ({ fields, onChange }: Props) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const addField = (type: SchemeFieldType) => {
    const baseKey = `field_${type}_${Date.now().toString(36).slice(-4)}`;
    const newField: SchemeField = {
      key: baseKey,
      label: `${t(FIELD_TYPES.find((x) => x.type === type)!.labelKey)}字段`,
      type,
      required: false,
      ui_width: 'medium',
    };
    if (type === 'select' || type === 'multi_select' || type === 'radio' || type === 'checkbox_group') {
      newField.options = [{ label: '选项1', value: 'option1' }];
    }
    const next = [...fields, newField];
    onChange(next);
    setSelectedIndex(next.length - 1);
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    if (selectedIndex === index) setSelectedIndex(target);
    else if (selectedIndex === target) setSelectedIndex(index);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex !== null && selectedIndex > index) setSelectedIndex(selectedIndex - 1);
  };

  const updateField = (index: number, patch: SchemeField) => {
    if (fields.some((f, i) => i !== index && f.key === patch.key)) {
      Toast.error(t('requirements.scheme.builder.errors.fieldKeyDuplicate'));
      return;
    }
    onChange(fields.map((f, i) => (i === index ? patch : f)));
    Toast.success(t('common.saved') as string);
  };

  const selectedField = selectedIndex !== null ? fields[selectedIndex] ?? null : null;

  return (
    <div className="form-builder scheme-builder-pane" style={{ padding: 16 }}>
      {/* 左：字段类型库 */}
      <div className="field-palette">
        <div className="palette-title">{t('requirements.scheme.builder.fieldType.paletteTitle')}</div>
        {FIELD_TYPES.map((ft) => (
          <Button
            key={ft.type}
            className="palette-item"
            theme="borderless"
            type="tertiary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => addField(ft.type)}
          >
            {t(ft.labelKey)}
          </Button>
        ))}
      </div>

      {/* 中：表单画布 */}
      <div className="form-canvas">
        <div className="canvas-section">
          <div className="canvas-section-title">{t('requirements.scheme.builder.systemFields')}</div>
          {SYSTEM_FIELDS.map((sf) => (
            <div key={sf.key} className="field-row system">
              <Lock size={14} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />
              <div className="row-main">
                <span className="row-label">{sf.label}</span>
                <Text type="tertiary" size="small">({sf.key})</Text>
                <Tag color="grey" size="small">{sf.type}</Tag>
              </div>
            </div>
          ))}
        </div>

        <div className="canvas-section">
          <div className="canvas-section-title">
            {t('requirements.scheme.builder.customFields')} ({fields.length})
          </div>
          {fields.length === 0 && (
            <Text type="tertiary" size="small">{t('requirements.scheme.builder.emptyFields')}</Text>
          )}
          {fields.map((f, idx) => (
            <div
              key={`${f.key}-${idx}`}
              className={`field-row${selectedIndex === idx ? ' selected' : ''}`}
              onClick={() => setSelectedIndex(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row-main">
                <span className="row-label">{f.label}</span>
                <Text type="tertiary" size="small">({f.key})</Text>
                <Tag color="blue" type="light" size="small">{f.type}</Tag>
                {f.required && <Tag color="red" type="light" size="small">必填</Tag>}
                {f.depends_on && <Tag color="purple" type="light" size="small">依赖</Tag>}
              </div>
              <Tooltip content={t('common.moveUp')}>
                <Button icon={<ArrowUp size={14} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" disabled={idx === 0}
                  onClick={(e) => { e.stopPropagation(); moveField(idx, -1); }} />
              </Tooltip>
              <Tooltip content={t('common.moveDown')}>
                <Button icon={<ArrowDown size={14} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" disabled={idx === fields.length - 1}
                  onClick={(e) => { e.stopPropagation(); moveField(idx, 1); }} />
              </Tooltip>
              <Button icon={<Settings2 size={14} strokeWidth={2} />} theme="borderless" type="tertiary" size="small"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(idx); }} />
              <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small"
                onClick={(e) => { e.stopPropagation(); removeField(idx); }} />
            </div>
          ))}
        </div>
      </div>

      {/* 右：字段配置面板 */}
      <FieldConfigPanel
        field={selectedField}
        index={selectedIndex ?? -1}
        allFields={fields}
        onSubmit={(updated) => selectedIndex !== null && updateField(selectedIndex, updated)}
        onCancel={() => setSelectedIndex(null)}
      />
    </div>
  );
};

export default FormBuilder;
