import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography, Avatar, Checkbox } from '@douyinfe/semi-ui';
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

interface MultiExtras {
  /** Controlled include-children state (multi-select only). */
  includeChildren?: boolean;
  /** Initial value for include-children (uncontrolled). Defaults to false. */
  defaultIncludeChildren?: boolean;
  /** Fires when user toggles the "include sub-departments" checkbox. */
  onIncludeChildrenChange?: (checked: boolean) => void;
}

type DepartmentSearchSelectProps =
  | (DepartmentSearchSelectBaseProps & {
      multiple?: false;
      value?: string;
      onChange?: (value: string) => void;
    })
  | (DepartmentSearchSelectBaseProps &
      MultiExtras & {
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

/** Build map: node value/name -> self + all descendant values/names */
const buildDescendantMap = (
  nodes: DeptTreeNode[],
  useNameAsValue: boolean,
  map: Map<string, string[]> = new Map(),
): Map<string, string[]> => {
  for (const node of nodes) {
    const collect = (n: DeptTreeNode, acc: string[]) => {
      acc.push(useNameAsValue ? n.label : n.value);
      n.children?.forEach((c) => collect(c, acc));
    };
    const list: string[] = [];
    collect(node, list);
    map.set(useNameAsValue ? node.label : node.value, list);
    if (node.children && node.children.length > 0) {
      buildDescendantMap(node.children, useNameAsValue, map);
    }
  }
  return map;
};

const descendantMapByName = buildDescendantMap(departmentTree, true);
const descendantMapById = buildDescendantMap(departmentTree, false);

/**
 * Expand a list of selected department values into self + all descendants.
 * Used by list pages when "include sub-departments" is enabled, so that the
 * actual filter set differs from the chip display (which still shows the
 * user's raw selection).
 */
export const expandDepartmentValues = (
  values: string[] | undefined,
  includeChildren: boolean,
  useNameAsValue = false,
): string[] => {
  if (!values || values.length === 0) return [];
  if (!includeChildren) return [...values];
  const map = useNameAsValue ? descendantMapByName : descendantMapById;
  const set = new Set<string>();
  values.forEach((v) => {
    const list = map.get(v);
    if (list) list.forEach((x) => set.add(x));
    else set.add(v);
  });
  return Array.from(set);
};

const { Text } = Typography;

const DepartmentSearchSelect = (props: DepartmentSearchSelectProps) => {
  const {
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
  } = props;
  const onChangeAny = onChange as ((v: string | string[]) => void) | undefined;
  const { t } = useTranslation();

  const multiExtras = multiple ? (props as DepartmentSearchSelectBaseProps & MultiExtras) : undefined;
  const isIncludeControlled = multiExtras?.includeChildren !== undefined;
  const [includeChildrenInner, setIncludeChildrenInner] = useState<boolean>(
    multiExtras?.defaultIncludeChildren ?? false,
  );
  const includeChildren = isIncludeControlled
    ? !!multiExtras?.includeChildren
    : includeChildrenInner;

  const handleIncludeChildrenChange = (checked: boolean) => {
    if (!isIncludeControlled) setIncludeChildrenInner(checked);
    multiExtras?.onIncludeChildrenChange?.(checked);
  };

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
      onChange={(val) => onChangeAny?.(multiple ? ((val as string[]) || []) : (val as string))}
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
      outerBottomSlot={
        multiple ? (
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--semi-color-border)',
              background: 'var(--semi-color-bg-0)',
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Checkbox
              checked={includeChildren}
              onChange={(e) => handleIncludeChildrenChange(!!e.target.checked)}
            >
              <Text style={{ fontSize: 13 }}>{t('common.includeSubDepartments')}</Text>
            </Checkbox>
          </div>
        ) : null
      }
      renderSelectedItem={
        multiple
          ? undefined
          : (option) => {
              const opt = option as unknown as FlatDeptOption;
              return <span>{opt.label}</span>;
            }
      }
      renderOptionItem={(rProps: Record<string, unknown>) => {
        const {
          disabled: optDisabled,
          selected,
          label,
          parentPath,
          onMouseEnter,
          onClick,
          style: optStyle,
          className: optClass,
        } = rProps as {
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
