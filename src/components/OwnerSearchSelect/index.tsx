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
        return opt.searchText.includes(input.toLowerCase());
      }}
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
      renderSelectedItem={(option) => {
        const opt = option as unknown as UserOption;
        return <span>{opt.label}</span>;
      }}
    >
      {options.map((opt) => (
        <Select.Option
          key={opt.value}
          value={opt.value}
          label={opt.label}
          {...({ department: opt.department, searchText: opt.searchText } as Record<string, unknown>)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Avatar
              size="extra-small"
              style={{ backgroundColor: 'var(--semi-color-fill-2)', color: 'var(--semi-color-text-0)', flexShrink: 0 }}
            >
              {opt.label.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <Text ellipsis={{ showTooltip: true }} style={{ margin: 0, fontSize: 14 }}>
                {opt.label}
              </Text>
              <Text
                ellipsis={{ showTooltip: true }}
                style={{ margin: 0, fontSize: 12, color: 'var(--semi-color-text-2)' }}
              >
                {opt.department}
              </Text>
            </div>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default OwnerSearchSelect;
