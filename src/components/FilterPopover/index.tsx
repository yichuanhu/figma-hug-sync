import { useMemo, ReactNode, memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Popover,
  CheckboxGroup,
  DatePicker,
  Typography,
} from '@douyinfe/semi-ui';
import { IconFilterStroked } from '@douyinfe/semi-icons';
import './index.less';

const { Text } = Typography;

/**
 * 筛选项配置
 */
export interface FilterOption {
  value: string | boolean | number;
  label: string;
}

/**
 * 筛选区块配置
 */
export interface FilterSection {
  /** 唯一标识 */
  key: string;
  /** 区块标题 */
  label: string;
  /** 筛选类型 */
  type: 'checkbox' | 'radio' | 'dateRange';
  /** 选项列表（checkbox/radio类型必填） */
  options?: FilterOption[];
  /** 当前选中值（由外部控制） */
  value: unknown;
  /** 日期快捷选项（dateRange类型可选） */
  datePresets?: Array<{ text: string; start: Date; end: Date }>;
}

export interface FilterPopoverProps {
  /** 筛选区块配置列表 */
  sections: FilterSection[];
  /** 弹出层可见性 */
  visible: boolean;
  /** 可见性变化回调 */
  onVisibleChange: (visible: boolean) => void;
  /** 确认回调，返回所有筛选值 */
  onConfirm: (values: Record<string, unknown>) => void;
  /** 自定义触发器（可选，默认为筛选按钮） */
  trigger?: ReactNode;
  /** 弹出层位置 */
  position?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
  /** 自定义类名 */
  className?: string;
}

/**
 * 内部编辑状态类型
 */
interface InternalSectionState {
  key: string;
  type: 'checkbox' | 'radio' | 'dateRange';
  value: unknown;
}

/**
 * 筛选区块项组件（使用 memo 优化，避免无关渲染）
 */
const FilterSectionItem = memo(
  ({
    section,
    onChange,
  }: {
    section: InternalSectionState & { label: string; options?: FilterOption[]; datePresets?: Array<{ text: string; start: Date; end: Date }> };
    onChange: (value: unknown) => void;
  }) => {
    switch (section.type) {
      case 'checkbox':
        return (
          <CheckboxGroup
            value={section.value as (string | boolean | number)[]}
            onChange={(values) => onChange(values)}
            options={section.options}
            direction="horizontal"
          />
        );
      case 'radio':
        // 单选使用 CheckboxGroup 实现，只保留最后选中项
        return (
          <CheckboxGroup
            value={section.value !== null && section.value !== undefined ? [section.value] : []}
            onChange={(values) => {
              const newValue = values.length > 0 ? values[values.length - 1] : null;
              onChange(newValue);
            }}
            options={section.options}
            direction="horizontal"
          />
        );
      case 'dateRange':
        return (
          <DatePicker
            type="dateRange"
            value={section.value as [Date, Date] | undefined}
            onChange={(dates) => {
              const validDates =
                dates && Array.isArray(dates) && dates.length === 2 && dates[0] && dates[1]
                  ? (dates as [Date, Date])
                  : null;
              onChange(validDates);
            }}
            presets={section.datePresets}
            style={{ width: '100%' }}
          />
        );
      default:
        return null;
    }
  }
);

FilterSectionItem.displayName = 'FilterSectionItem';

/**
 * 通用筛选弹出层组件
 *
 * 内部管理编辑状态，仅在点击确认时才将值传递给外部。
 *
 * 支持多种筛选类型：
 * - checkbox: 多选
 * - radio: 单选（使用 CheckboxGroup 实现，只保留最后选中项）
 * - dateRange: 日期范围选择
 *
 * @example
 * ```tsx
 * const [statusFilter, setStatusFilter] = useState<string[]>([]);
 * const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
 * const [visible, setVisible] = useState(false);
 *
 * <FilterPopover
 *   visible={visible}
 *   onVisibleChange={setVisible}
 *   sections={[
 *     {
 *       key: 'status',
 *       label: '状态',
 *       type: 'checkbox',
 *       options: [
 *         { value: 'active', label: '活跃' },
 *         { value: 'inactive', label: '未活跃' },
 *       ],
 *       value: statusFilter,
 *     },
 *     {
 *       key: 'date',
 *       label: '日期范围',
 *       type: 'dateRange',
 *       value: dateRange,
 *     },
 *   ]}
 *   onConfirm={(values) => {
 *     setStatusFilter(values.status as string[]);
 *     setDateRange(values.date as [Date, Date] | null);
 *   }}
 * />
 * ```
 */
const FilterPopover = ({
  sections,
  visible,
  onVisibleChange,
  onConfirm,
  trigger,
  position = 'bottomLeft',
  className,
}: FilterPopoverProps) => {
  const { t } = useI18n();

  // 内部编辑状态（仅在弹窗打开时同步外部值）
  const [internalValues, setInternalValues] = useState<Record<string, unknown>>({});

  // 弹窗打开时，同步外部值到内部状态
  useEffect(() => {
    if (visible) {
      const values: Record<string, unknown> = {};
      sections.forEach((section) => {
        values[section.key] = section.value;
      });
      setInternalValues(values);
    }
  }, [visible, sections]);

  // 更新内部单个值
  const handleInternalChange = (key: string, value: unknown) => {
    setInternalValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 计算筛选数量（用于按钮显示，基于外部实际值）
  const filterCount = useMemo(() => {
    return sections.reduce((count, section) => {
      if (section.type === 'dateRange') {
        return count;
      }
      const value = section.value;
      if (Array.isArray(value)) {
        return count + value.length;
      }
      if (value !== null && value !== undefined) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [sections]);

  // 检查是否可以重置（基于内部编辑值）
  const canReset = useMemo(() => {
    return Object.values(internalValues).some((value) => {
      if (Array.isArray(value) && value.length > 0) return true;
      if (value !== null && value !== undefined && !Array.isArray(value)) return true;
      return false;
    });
  }, [internalValues]);

  // 处理重置（重置内部编辑状态）
  const handleReset = () => {
    const resetValues: Record<string, unknown> = {};
    sections.forEach((section) => {
      if (section.type === 'checkbox') {
        resetValues[section.key] = [];
      } else if (section.type === 'dateRange') {
        resetValues[section.key] = null;
      } else {
        resetValues[section.key] = null;
      }
    });
    setInternalValues(resetValues);
  };

  // 处理确认（将内部值传递给外部）
  const handleConfirm = () => {
    onConfirm(internalValues);
    onVisibleChange(false);
  };

  // 默认触发按钮
  const defaultTrigger = (
    <Button
      icon={<IconFilterStroked />}
      type={filterCount > 0 ? 'primary' : 'tertiary'}
      theme={filterCount > 0 ? 'solid' : 'light'}
    >
      {t('common.filter')}
      {filterCount > 0 ? ` (${filterCount})` : ''}
    </Button>
  );

  return (
    <Popover
      visible={visible}
      onVisibleChange={onVisibleChange}
      trigger="click"
      position={position}
      content={
        <div className={`filter-popover-content ${className || ''}`}>
          {sections.map((section) => (
            <div key={section.key} className="filter-popover-content-section">
              <Text strong className="filter-popover-content-label">
                {section.label}
              </Text>
              <FilterSectionItem
                section={{
                  ...section,
                  value: internalValues[section.key],
                }}
                onChange={(value) => handleInternalChange(section.key, value)}
              />
            </div>
          ))}
          <div className="filter-popover-content-footer">
            <Button theme="borderless" onClick={handleReset} disabled={!canReset}>
              {t('common.reset')}
            </Button>
            <Button theme="solid" type="primary" onClick={handleConfirm}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      }
    >
      {trigger || defaultTrigger}
    </Popover>
  );
};

export default FilterPopover;
