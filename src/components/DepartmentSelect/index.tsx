import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeSelect } from '@douyinfe/semi-ui';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';

interface DepartmentSelectBaseProps {
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Use department name as value instead of ID (for filter compatibility) */
  useNameAsValue?: boolean;
  showClear?: boolean;
}

interface SingleSelectProps extends DepartmentSelectBaseProps {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
  maxTagCount?: never;
}

interface MultiSelectProps extends DepartmentSelectBaseProps {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
  maxTagCount?: number;
}

type DepartmentSelectProps = SingleSelectProps | MultiSelectProps;

interface DepartmentTreeSelectNode {
  key: string;
  value: string;
  label: string;
  children?: DepartmentTreeSelectNode[];
}

const normalizeDepartmentTree = (
  nodes: DeptTreeNode[],
  useNameAsValue: boolean,
): DepartmentTreeSelectNode[] =>
  nodes.map((node) => ({
    key: node.value,
    value: useNameAsValue ? node.label : node.value,
    label: node.label,
    children: node.children
      ? normalizeDepartmentTree(node.children, useNameAsValue)
      : undefined,
  }));

const DepartmentSelect = (props: DepartmentSelectProps) => {
  const {
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
  } = props as any;

  const { t } = useTranslation();

  const treeData = useMemo(
    () => normalizeDepartmentTree(departmentTree, useNameAsValue),
    [useNameAsValue],
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
      defaultExpandAll
      treeNodeFilterProp="label"
      filterTreeNode
      searchAutoFocus
      searchPosition="dropdown"
      showSearchClear
      style={{ ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
    />
  );
};

export default DepartmentSelect;
