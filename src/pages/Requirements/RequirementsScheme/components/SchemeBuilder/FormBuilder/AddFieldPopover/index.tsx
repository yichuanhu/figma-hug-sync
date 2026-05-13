import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, Button } from '@douyinfe/semi-ui';
import {
  Plus,
  AlignLeft,
  Type,
  Hash,
  Percent,
  ChevronDown,
  ListChecks,
  CircleDot,
  CheckSquare,
  SquareStack,
  Calendar,
  Paperclip,
  FileText,
  Calculator,
} from 'lucide-react';
import type { SchemeFieldType } from '@/pages/Requirements/RequirementsWorkbench/types';

interface Props {
  onAdd: (type: SchemeFieldType) => void;
}

const ITEMS: Array<{ type: SchemeFieldType; labelKey: string; Icon: React.ElementType }> = [
  { type: 'text', labelKey: 'requirements.scheme.builder.fieldType.text', Icon: Type },
  { type: 'textarea', labelKey: 'requirements.scheme.builder.fieldType.textarea', Icon: AlignLeft },
  { type: 'number', labelKey: 'requirements.scheme.builder.fieldType.number', Icon: Hash },
  { type: 'percentage', labelKey: 'requirements.scheme.builder.fieldType.percentage', Icon: Percent },
  { type: 'select', labelKey: 'requirements.scheme.builder.fieldType.select', Icon: ChevronDown },
  { type: 'multi_select', labelKey: 'requirements.scheme.builder.fieldType.multi_select', Icon: ListChecks },
  { type: 'radio', labelKey: 'requirements.scheme.builder.fieldType.radio', Icon: CircleDot },
  { type: 'checkbox', labelKey: 'requirements.scheme.builder.fieldType.checkbox', Icon: CheckSquare },
  { type: 'checkbox_group', labelKey: 'requirements.scheme.builder.fieldType.checkbox_group', Icon: SquareStack },
  { type: 'date', labelKey: 'requirements.scheme.builder.fieldType.date', Icon: Calendar },
  { type: 'file_upload', labelKey: 'requirements.scheme.builder.fieldType.file_upload', Icon: Paperclip },
  { type: 'rich_text', labelKey: 'requirements.scheme.builder.fieldType.rich_text', Icon: FileText },
  { type: 'calculation', labelKey: 'requirements.scheme.builder.fieldType.calculation', Icon: Calculator },
];

const AddFieldPopover = ({ onAdd }: Props) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const content = (
    <div className="add-field-popover">
      <div className="afp-title">添加字段</div>
      <div className="afp-grid">
        {ITEMS.map(({ type, labelKey, Icon }) => (
          <button
            key={type}
            className="afp-item"
            onClick={() => {
              onAdd(type);
              setVisible(false);
            }}
          >
            <span className="afp-icon">
              <Icon size={16} strokeWidth={2} />
            </span>
            <span className="afp-label">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      position="top"
      visible={visible}
      onVisibleChange={setVisible}
      content={content}
      showArrow={false}
    >
      <Button
        className="add-field-btn"
        theme="borderless"
        type="tertiary"
        icon={<Plus size={16} strokeWidth={2} />}
        block
      >
        添加字段
      </Button>
    </Popover>
  );
};

export default AddFieldPopover;
