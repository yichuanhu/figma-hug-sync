import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeSelect, Tooltip, Typography } from '@douyinfe/semi-ui';
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

/** Collect all labels from tree */
const collectLabels = (nodes: DeptTreeNode[]): string[] => {
  const labels: string[] = [];
  const walk = (list: DeptTreeNode[]) => {
    for (const n of list) {
      labels.push(n.label);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return labels;
};

/** Estimate text width: CJK chars ~14px, others ~8px, plus tree indent & padding */
const estimateMaxDropdownWidth = (labels: string[]): number => {
  let maxWidth = 0;
  for (const label of labels) {
    let w = 0;
    for (const ch of label) {
      w += ch.charCodeAt(0) > 255 ? 14 : 8;
    }
    if (w > maxWidth) maxWidth = w;
  }
  // Add padding for tree indent (up to 3 levels * 20px) + checkbox/icon + scrollbar
  return Math.min(maxWidth + 100, 600);
};

const { Text } = Typography;

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

  const dropdownWidth = useMemo(() => estimateMaxDropdownWidth(collectLabels(departmentTree)), []);

  return (
    <TreeSelect
      value={value}
      onChange={(val) => onChange?.(val as any)}
      treeData={treeData}
      placeholder={placeholder || t('common.owningDepartmentPlaceholder')}
      disabled={disabled}
      multiple={multiple}
      checkRelation="unRelated"
      showClear={showClear ?? !multiple}
      maxTagCount={maxTagCount}
      defaultExpandAll
      treeNodeFilterProp="label"
      filterTreeNode
      searchAutoFocus
      searchPosition="dropdown"
      showSearchClear
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto', width: dropdownWidth }}
      renderLabel={(label) => (
        <Text
          ellipsis={{ showTooltip: true }}
          style={{ width: '100%', margin: 0 }}
        >
          {label as string}
        </Text>
      )}
    />
  );
};

export default DepartmentSelect;
