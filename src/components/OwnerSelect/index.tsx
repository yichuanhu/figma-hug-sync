import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeSelect, Typography } from '@douyinfe/semi-ui';
import { User } from 'lucide-react';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';
import { ALL_ORG_USERS, OrgUser } from '@/components/CollaboratorManager/mockData';

interface OwnerSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

interface TreeNode {
  key: string;
  value: string;
  label: string;
  disabled?: boolean;
  isLeaf?: boolean;
  isUser?: boolean;
  children?: TreeNode[];
}

/** Group users by department name */
const groupUsersByDept = (users: OrgUser[]): Map<string, OrgUser[]> => {
  const map = new Map<string, OrgUser[]>();
  for (const u of users) {
    const list = map.get(u.department) || [];
    list.push(u);
    map.set(u.department, list);
  }
  return map;
};

/** Build tree: departments (non-selectable) with user leaf nodes (selectable) */
const buildOwnerTree = (
  deptNodes: DeptTreeNode[],
  usersByDept: Map<string, OrgUser[]>,
): TreeNode[] => {
  const result: TreeNode[] = [];

  for (const dept of deptNodes) {
    const users = usersByDept.get(dept.label) || [];
    const childDeptNodes = dept.children
      ? buildOwnerTree(dept.children, usersByDept)
      : [];

    const userNodes: TreeNode[] = users.map((u) => ({
      key: u.id,
      value: u.id,
      label: u.name,
      isLeaf: true,
      isUser: true,
    }));

    const allChildren = [...childDeptNodes, ...userNodes];

    // Only include department if it has children (sub-depts or users)
    if (allChildren.length > 0) {
      result.push({
        key: `dept-node-${dept.value}`,
        value: `dept-node-${dept.value}`,
        label: dept.label,
        disabled: true,
        children: allChildren,
      });
    }
  }

  return result;
};

/** Estimate dropdown width */
const estimateDropdownWidth = (users: OrgUser[]): number => {
  let maxWidth = 0;
  for (const u of users) {
    let w = 0;
    for (const ch of u.name) {
      w += ch.charCodeAt(0) > 255 ? 14 : 8;
    }
    if (w > maxWidth) maxWidth = w;
  }
  // padding for tree indent (up to 4 levels * 20px) + scrollbar
  return Math.min(maxWidth + 120, 500);
};

const { Text } = Typography;

const OwnerSelect = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  className,
}: OwnerSelectProps) => {
  const { t } = useTranslation();

  const usersByDept = useMemo(() => groupUsersByDept(ALL_ORG_USERS), []);

  const treeData = useMemo(
    () => buildOwnerTree(departmentTree, usersByDept),
    [usersByDept],
  );

  const dropdownWidth = useMemo(() => estimateDropdownWidth(ALL_ORG_USERS), []);

  return (
    <TreeSelect
      value={value}
      onChange={(val) => onChange?.(val as string)}
      treeData={treeData}
      placeholder={placeholder || t('common.ownerPlaceholder')}
      disabled={disabled}
      showClear
      defaultExpandedKeys={treeData.length > 0 ? [treeData[0].key] : []}
      treeNodeFilterProp="label"
      filterTreeNode
      searchAutoFocus
      searchPosition="dropdown"
      showSearchClear
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto', width: dropdownWidth }}
      renderLabel={(label, data) => {
        const isUser = (data as any)?.isUser;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: '100%', minWidth: 0 }}>
            {isUser && (
              <User size={14} style={{ flexShrink: 0, color: 'var(--semi-color-text-2)' }} />
            )}
            <Text
              ellipsis={{ showTooltip: true }}
              style={{ flex: 1, minWidth: 0, margin: 0 }}
            >
              {label as string}
            </Text>
          </span>
        );
      }}
    />
  );
};

export default OwnerSelect;
