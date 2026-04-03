import { useTranslation } from 'react-i18next';
import { Select, Divider } from '@douyinfe/semi-ui';
import { Typography } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import type { CollaboratorRole, CollaboratorAssetType } from '@/api/index';
import { ASSET_AVAILABLE_ROLES } from '@/api/index';

const { Text } = Typography;

interface CollaboratorRoleSelectProps {
  value: CollaboratorRole;
  onChange: (role: CollaboratorRole) => void;
  assetType: CollaboratorAssetType;
  disabled?: boolean;
  size?: 'small' | 'default' | 'large';
  onRemove?: () => void;
}

const CollaboratorRoleSelect = ({
  value,
  onChange,
  assetType,
  disabled = false,
  size = 'small',
  onRemove,
}: CollaboratorRoleSelectProps) => {
  const { t } = useTranslation();

  const availableRoles = ASSET_AVAILABLE_ROLES[assetType] || ['MANAGER', 'MAINTAINER', 'USER', 'OBSERVER'];

  const roleOptions = availableRoles.map((role) => ({
    value: role,
    label: t(`collaborator.roles.${role}`),
  }));

  const renderOptionItem = (renderProps: {
    disabled: boolean;
    selected: boolean;
    label: React.ReactNode;
    value: string;
    focused: boolean;
    onMouseEnter: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
    className?: string;
  }) => {
    const { disabled: optDisabled, selected, label, value: optValue, onMouseEnter, onClick, style, className } = renderProps;
    const desc = t(`collaborator.roleDesc.${optValue}`);

    return (
      <div
        style={{
          ...style,
          padding: '8px 12px',
          cursor: optDisabled ? 'not-allowed' : 'pointer',
          background: selected ? 'var(--semi-color-primary-light-default)' : undefined,
        }}
        className={className}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text size="small" strong={selected} style={{ color: selected ? 'var(--semi-color-primary)' : undefined }}>
            {label}
          </Text>
          <Text size="small" type="tertiary" style={{ fontSize: 12, lineHeight: '16px' }}>
            {desc}
          </Text>
        </div>
      </div>
    );
  };

  const removeSlot = onRemove ? (
    <>
      <Divider style={{ margin: 0 }} />
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--semi-color-danger)',
          fontSize: 13,
        }}
        onClick={onRemove}
      >
        <IconDeleteStroked size="small" style={{ fontSize: 14 }} />
        {t('collaborator.actions.remove')}
      </div>
    </>
  ) : undefined;

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as CollaboratorRole)}
      optionList={roleOptions}
      disabled={disabled}
      size={size}
      style={{ width: 100 }}
      renderOptionItem={renderOptionItem}
      dropdownStyle={{ width: 260 }}
      outerBottomSlot={removeSlot}
    />
  );
};

export default CollaboratorRoleSelect;
