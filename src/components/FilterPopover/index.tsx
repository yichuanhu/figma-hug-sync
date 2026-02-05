import { useMemo, ReactNode } from 'react';
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
  /** 当前选中值 */
  value: unknown;
  /** 值变化回调 */
  onChange: (value: unknown) => void;
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
  /** 重置回调 */
  onReset: () => void;
  /** 确认回调（可选，默认关闭弹窗） */
  onConfirm?: () => void;
  /** 自定义触发器（可选，默认为筛选按钮） */
  trigger?: ReactNode;
  /** 弹出层位置 */
  position?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用筛选弹出层组件
 * 
 * 支持多种筛选类型：
 * - checkbox: 多选
 * - radio: 单选（使用checkbox实现，只保留最后选中项）
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
 *       onChange: setStatusFilter,
 *     },
 *     {
 *       key: 'date',
 *       label: '日期范围',
 *       type: 'dateRange',
 *       value: dateRange,
 *       onChange: setDateRange,
 *     },
 *   ]}
 *   onReset={() => {
 *     setStatusFilter([]);
 *     setDateRange(null);
 *   }}
 * />
 * ```
 */
const FilterPopover = ({
  sections,
  visible,
  onVisibleChange,
  onReset,
  onConfirm,
  trigger,
  position = 'bottomLeft',
  className,
}: FilterPopoverProps) => {
  const { t } = useTranslation();

  // 计算筛选数量（用于按钮显示）
  const filterCount = useMemo(() => {
    return sections.reduce((count, section) => {
      if (section.type === 'dateRange') {
        // 日期范围不计入筛选数量
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

  // 检查是否可以重置
  const canReset = useMemo(() => {
    return sections.some((section) => {
      const value = section.value;
      if (Array.isArray(value) && value.length > 0) return true;
      if (value !== null && value !== undefined && !Array.isArray(value)) return true;
      return false;
    });
  }, [sections]);

  // 处理确认
  const handleConfirm = () => {
    onConfirm?.();
    onVisibleChange(false);
  };

  // 渲染筛选区块
  const renderSection = (section: FilterSection) => {
    switch (section.type) {
      case 'checkbox':
        return (
          <CheckboxGroup
            value={section.value as (string | boolean | number)[]}
            onChange={(values) => section.onChange(values)}
            options={section.options}
            direction="horizontal"
          />
        );
      case 'radio':
        // 单选使用checkbox实现，只保留最后选中项
        return (
          <CheckboxGroup
            value={section.value !== null && section.value !== undefined ? [section.value] : []}
            onChange={(values) => {
              const newValue = values.length > 0 ? values[values.length - 1] : null;
              section.onChange(newValue);
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
              // 处理空数组转null
              const validDates = dates && Array.isArray(dates) && dates.length === 2 && dates[0] && dates[1]
                ? (dates as [Date, Date])
                : null;
              section.onChange(validDates);
            }}
            presets={section.datePresets}
            style={{ width: '100%' }}
          />
        );
      default:
        return null;
    }
  };

  // 默认触发按钮
  const defaultTrigger = (
    <Button
       icon={<IconFilterStroked />}
      type={filterCount > 0 ? 'primary' : 'tertiary'}
      theme={filterCount > 0 ? 'solid' : 'light'}
    >
      {t('common.filter')}{filterCount > 0 ? ` (${filterCount})` : ''}
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
              {renderSection(section)}
            </div>
          ))}
          <div className="filter-popover-content-footer">
            <Button 
              theme="borderless" 
              onClick={onReset}
              disabled={!canReset}
            >
              {t('common.reset')}
            </Button>
            <Button 
              theme="solid" 
              type="primary" 
              onClick={handleConfirm}
            >
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
