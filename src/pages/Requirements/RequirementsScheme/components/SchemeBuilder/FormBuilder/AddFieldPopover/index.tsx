import { useState, isValidElement, cloneElement } from 'react';
import type { ReactElement, ReactNode, MouseEvent } from 'react';
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
  /** 紧凑模式：小尺寸文字按钮，用于分组标题右侧 */
  compact?: boolean;
  /** empty 模式：使用传入的 children 作为触发器（如可点击空状态卡片） */
  mode?: 'empty';
  children?: ReactNode;
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

const AddFieldPopover = ({ onAdd, compact, mode, children }: Props) => {
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

  let trigger: ReactNode;
  if (mode === 'empty' && isValidElement(children)) {
    // 把 children 作为触发器
    trigger = cloneElement(children as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
      onClick: () => setVisible((v) => !v),
    });
  } else if (compact) {
    trigger = (
      <Button
        size="small"
        theme="borderless"
        type="primary"
        icon={<Plus size={14} strokeWidth={2} />}
      >
        添加字段
      </Button>
    );
  } else {
    trigger = (
      <Button
        className="add-field-btn"
        theme="borderless"
        type="tertiary"
        icon={<Plus size={16} strokeWidth={2} />}
        block
      >
        添加字段
      </Button>
    );
  }

  return (
    <Popover
      trigger="click"
      position="top"
      visible={visible}
      onVisibleChange={setVisible}
      content={content}
      showArrow={false}
    >
      {trigger}
    </Popover>
  );
};

export default AddFieldPopover;
