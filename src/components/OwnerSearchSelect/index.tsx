import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography, Avatar } from '@douyinfe/semi-ui';
import { ALL_ORG_USERS, OrgUser } from '@/components/CollaboratorManager/mockData';

interface OwnerSearchSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

interface UserOption {
  value: string;
  label: string;
  department: string;
  searchText: string;
}

const buildOptions = (users: OrgUser[]): UserOption[] =>
  users.map((u) => ({
    value: u.id,
    label: u.name,
    department: u.department,
    searchText: `${u.name} ${u.department}`.toLowerCase(),
  }));

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

  const options = useMemo(() => buildOptions(ALL_ORG_USERS), []);

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
          department,
          onMouseEnter,
          onClick,
          style: optStyle,
          className: optClass,
        } = props as {
          disabled?: boolean;
          selected?: boolean;
          label: string;
          department: string;
          onMouseEnter?: (e: React.MouseEvent) => void;
          onClick?: (e: React.MouseEvent) => void;
          style?: React.CSSProperties;
          className?: string;
        };
        const deptSegments = (department || '').split(' / ');
        const deptDisplay =
          deptSegments.length > 3
            ? `${deptSegments[0]} / ... / ${deptSegments[deptSegments.length - 1]}`
            : department;
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
                {department}
              </Text>
            </div>
          </div>
        );
      }}
    />
  );
};

export default OwnerSearchSelect;
