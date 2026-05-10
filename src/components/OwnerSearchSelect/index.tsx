import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography, Avatar } from '@douyinfe/semi-ui';
import { ALL_ORG_USERS, OrgUser } from '@/components/CollaboratorManager/mockData';
import { departmentTree, DeptTreeNode } from '@/mocks/departmentData';

interface OwnerSearchSelectProps {
  value?: string | string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: any;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  multiple?: boolean;
  size?: 'small' | 'default' | 'large';
}

interface UserOption {
  value: string;
  label: string;
  department: string;
  departmentPath: string;
  searchText: string;
}

/** Build map: leaf department label -> full path segments */
const buildDeptPathMap = (
  nodes: DeptTreeNode[],
  parents: string[] = [],
  map: Map<string, string[]> = new Map(),
): Map<string, string[]> => {
  for (const node of nodes) {
    const path = [...parents, node.label];
    map.set(node.label, path);
    if (node.children?.length) {
      buildDeptPathMap(node.children, path, map);
    }
  }
  return map;
};

/** Parse department string to segments, supports '-' and '/' separators, and resolves leaf names */
const resolveDeptPath = (department: string, deptMap: Map<string, string[]>): string[] => {
  if (!department) return [];
  // If contains a path separator, split directly
  if (department.includes('/') || department.includes('-')) {
    const sep = department.includes('/') ? '/' : '-';
    return department.split(sep).map((s) => s.trim()).filter(Boolean);
  }
  // Otherwise treat as leaf label and look up full path
  const path = deptMap.get(department);
  return path ? path : [department];
};

/** Truncate path: keep first + last two when more than 3 segments */
const formatDeptPath = (segments: string[]): string => {
  if (segments.length <= 3) return segments.join(' / ');
  return `${segments[0]} / ... / ${segments[segments.length - 2]} / ${segments[segments.length - 1]}`;
};

const buildOptions = (users: OrgUser[], deptMap: Map<string, string[]>): UserOption[] =>
  users.map((u) => {
    const segments = resolveDeptPath(u.department, deptMap);
    return {
      value: u.id,
      label: u.name,
      department: u.department,
      departmentPath: formatDeptPath(segments),
      searchText: `${u.name} ${u.department} ${segments.join(' ')}`.toLowerCase(),
    };
  });

const { Text } = Typography;

const OwnerSearchSelect = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  className,
}: OwnerSearchSelectProps) => {
  const { t } = useTranslation();

  const deptMap = useMemo(() => buildDeptPathMap(departmentTree), []);
  const options = useMemo(() => buildOptions(ALL_ORG_USERS, deptMap), [deptMap]);

  return (
    <Select
      value={value}
      onChange={(val) => onChange?.(val as string)}
      placeholder={placeholder || t('common.ownerPlaceholder')}
      disabled={disabled}
      showClear
      filter={(input, option) => {
        const opt = option as unknown as UserOption;
        return (opt.searchText || '').includes((input || '').toLowerCase());
      }}
      style={{ width: '100%', ...style }}
      className={className}
      dropdownMatchSelectWidth
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
      optionList={options}
      renderSelectedItem={(option) => {
        const opt = option as unknown as UserOption;
        return <span>{opt.label}</span>;
      }}
      renderOptionItem={(props: Record<string, unknown>) => {
        const {
          disabled: optDisabled,
          selected,
          label,
          departmentPath,
          onMouseEnter,
          onClick,
          style: optStyle,
          className: optClass,
        } = props as {
          disabled?: boolean;
          selected?: boolean;
          label: string;
          departmentPath: string;
          onMouseEnter?: (e: React.MouseEvent) => void;
          onClick?: (e: React.MouseEvent) => void;
          style?: React.CSSProperties;
          className?: string;
        };
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
                backgroundColor: 'var(--semi-color-text-0)',
                color: 'var(--semi-color-bg-0)',
                flexShrink: 0,
                fontSize: 12,
              }}
            >
              {label.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <Text ellipsis={{ showTooltip: true }} style={{ margin: 0, fontSize: 14 }}>
                {label}
              </Text>
              <Text
                ellipsis={{ showTooltip: true }}
                style={{ margin: 0, fontSize: 12, color: 'var(--semi-color-text-2)' }}
              >
                {departmentPath}
              </Text>
            </div>
          </div>
        );
      }}
    />
  );
};

export default OwnerSearchSelect;
