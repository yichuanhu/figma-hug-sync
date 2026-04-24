import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography, Avatar } from '@douyinfe/semi-ui';
import { Network } from 'lucide-react';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';

interface DepartmentSearchSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Use department name as value instead of ID */
  useNameAsValue?: boolean;
  showClear?: boolean;
}

interface FlatDeptOption {
  value: string;
  label: string;
  parentPath: string;
  fullPath: string;
  searchText: string;
}

/** Flatten the department tree into a flat options list with parent path info */
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
}: DepartmentSearchSelectProps) => {
  const { t } = useTranslation();

  const options = useMemo(
    () => flattenDepartments(departmentTree, useNameAsValue),
    [useNameAsValue],
  );

  return (
    <Select
      value={value}
      onChange={(val) => onChange?.(val as string)}
      placeholder={placeholder || t('common.owningDepartmentPlaceholder')}
      disabled={disabled}
      showClear={showClear}
      filter={(input, option) => {
        const opt = option as unknown as FlatDeptOption;
        return opt.searchText.includes(input.toLowerCase());
      }}
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
      renderSelectedItem={(option) => {
        const opt = option as unknown as FlatDeptOption;
        return <span>{opt.label}</span>;
      }}
    >
      {options.map((opt) => (
        <Select.Option
          key={opt.value}
          value={opt.value}
          label={opt.label}
          {...({ parentPath: opt.parentPath, fullPath: opt.fullPath, searchText: opt.searchText } as Record<string, unknown>)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                {opt.label}
              </Text>
              <Text
                ellipsis={{ showTooltip: true }}
                style={{ margin: 0, fontSize: 12, color: 'var(--semi-color-text-2)' }}
              >
                {opt.parentPath ? `${opt.parentPath} / ${opt.label}` : opt.label}
              </Text>
            </div>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default DepartmentSearchSelect;
