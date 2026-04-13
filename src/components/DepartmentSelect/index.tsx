import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeSelect } from '@douyinfe/semi-ui';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';

interface DepartmentSelectProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Max tag count in multi-select mode */
  maxTagCount?: number;
  /** Use department name as value instead of ID (for filter compatibility) */
  useNameAsValue?: boolean;
}

/** Transform tree to use label as value */
const transformTreeToNameValues = (nodes: DeptTreeNode[]): DeptTreeNode[] =>
  nodes.map(node => ({
    value: node.label,
    label: node.label,
    children: node.children ? transformTreeToNameValues(node.children) : undefined,
  }));

const DepartmentSelect = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  className,
  multiple = false,
  showClear,
  maxTagCount,
  useNameAsValue = false,
}: DepartmentSelectProps) => {
  const { t } = useTranslation();

  const treeData = useMemo(
    () => (useNameAsValue ? transformTreeToNameValues(departmentTree) : departmentTree),
    [useNameAsValue]
  );

  return (
    <TreeSelect
      value={value}
      onChange={(val) => onChange?.(val as any)}
      treeData={treeData}
      placeholder={placeholder || t('common.owningDepartmentPlaceholder')}
      disabled={disabled}
      multiple={multiple}
      showClear={showClear ?? !multiple}
      maxTagCount={maxTagCount}
      filterTreeNode
      searchAutoFocus
      searchPosition="dropdown"
      showSearchClear
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
    />
  );
};

export default DepartmentSelect;
