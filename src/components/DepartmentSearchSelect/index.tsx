import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography, Avatar } from '@douyinfe/semi-ui';
import { Network } from 'lucide-react';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';

interface DepartmentSearchSelectBaseProps {
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Use department name as value instead of ID */
  useNameAsValue?: boolean;
  showClear?: boolean;
  maxTagCount?: number;
}

type DepartmentSearchSelectProps =
  | (DepartmentSearchSelectBaseProps & {
      multiple?: false;
      value?: string;
      onChange?: (value: string) => void;
    })
  | (DepartmentSearchSelectBaseProps & {
      multiple: true;
      value?: string[];
      onChange?: (value: string[]) => void;
    });

interface FlatDeptOption {
  value: string;
  label: string;
  parentPath: string;
  fullPath: string;
  searchText: string;
}

const flattenDepartments = (
  nodes: DeptTreeNode[],
  useNameAsValue: boolean,
  parentPath: string[] = [],
  result: FlatDeptOption[] = [],
): FlatDeptOption[] => {
  for (const node of nodes) {
    const path = parentPath.join(' / ');
    const fullPath = [...parentPath, node.label].join(' / ');
    result.push({
      value: useNameAsValue ? node.label : node.value,
      label: node.label,
      parentPath: path,
      fullPath,
      searchText: `${node.label} ${path}`.toLowerCase(),
    });
    if (node.children && node.children.length > 0) {
      flattenDepartments(node.children, useNameAsValue, [...parentPath, node.label], result);
    }
  }
  return result;
};

const { Text } = Typography;

const DepartmentSearchSelect = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  className,
  useNameAsValue = false,
  showClear = true,
  multiple = false,
  maxTagCount,
}: DepartmentSearchSelectProps) => {
  const onChangeAny = onChange as ((v: string | string[]) => void) | undefined;
  const { t } = useTranslation();

  const options = useMemo(
    () => flattenDepartments(departmentTree, useNameAsValue),
    [useNameAsValue],
  );

  const optionList = useMemo(
    () =>
      options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        parentPath: opt.parentPath,
        fullPath: opt.fullPath,
        searchText: opt.searchText,
      })),
    [options],
  );

  return (
    <Select
      value={value}
      onChange={(val) => onChange?.(multiple ? ((val as string[]) || []) : (val as string))}
      placeholder={placeholder || t('common.owningDepartmentPlaceholder')}
      disabled={disabled}
      showClear={showClear}
      multiple={multiple}
      maxTagCount={maxTagCount}
      filter={(input, option) => {
        const opt = option as unknown as FlatDeptOption;
        return (opt.searchText || '').includes((input || '').toLowerCase());
      }}
      style={{ width: '100%', ...style }}
      className={className}
      dropdownMatchSelectWidth
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
      optionList={optionList}
      renderSelectedItem={
        multiple
          ? undefined
          : (option) => {
              const opt = option as unknown as FlatDeptOption;
              return <span>{opt.label}</span>;
            }
      }
      renderOptionItem={(props: Record<string, unknown>) => {
        const {
          disabled: optDisabled,
          selected,
          label,
          fullPath,
          parentPath,
          onMouseEnter,
          onClick,
          style: optStyle,
          className: optClass,
        } = props as {
          disabled?: boolean;
          selected?: boolean;
          label: string;
          fullPath: string;
          parentPath: string;
          onMouseEnter?: (e: React.MouseEvent) => void;
          onClick?: (e: React.MouseEvent) => void;
          style?: React.CSSProperties;
          className?: string;
        };
        const fullPathStr = parentPath ? `${parentPath} / ${label}` : label;
        const segments = fullPathStr.split(' / ');
        const path =
          segments.length > 3
            ? `${segments[0]} / ... / ${segments[segments.length - 2]} / ${segments[segments.length - 1]}`
            : fullPathStr;
        return (
          <div
            className={`${optClass || ''} ${selected ? 'semi-select-option-selected' : ''}`}
            style={{
              ...optStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              cursor: optDisabled ? 'not-allowed' : 'pointer',
              minWidth: 0,
            }}
            onClick={optDisabled ? undefined : onClick}
            onMouseEnter={onMouseEnter}
          >
            <Avatar
              size="extra-small"
              style={{
                backgroundColor: 'var(--semi-color-fill-1)',
                color: 'var(--semi-color-text-0)',
                flexShrink: 0,
              }}
            >
              <Network size={14} strokeWidth={2} />
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <Text ellipsis={{ showTooltip: true }} style={{ margin: 0, fontSize: 14 }}>
                {label}
              </Text>
              <Text
                ellipsis={{ showTooltip: true }}
                style={{ margin: 0, fontSize: 12, color: 'var(--semi-color-text-2)' }}
              >
                {path}
              </Text>
            </div>
          </div>
        );
      }}
    />
  );
};

export default DepartmentSearchSelect;
