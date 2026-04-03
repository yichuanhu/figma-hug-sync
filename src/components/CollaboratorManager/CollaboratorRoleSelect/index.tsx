import { useTranslation } from 'react-i18next';
import { Select } from '@douyinfe/semi-ui';
import type { CollaboratorRole, CollaboratorAssetType } from '@/api/index';
import { ASSET_AVAILABLE_ROLES } from '@/api/index';

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
    const { selected, value: optValue, onMouseEnter, onClick, className } = renderProps;
    const desc = t(`collaborator.roleDesc.${optValue}`);

    return (
      <div
        className={className}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ 
            fontSize: 14, 
            fontWeight: selected ? 600 : 400,
            color: selected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
          }}>
            {t(`collaborator.roles.${optValue}`)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)', lineHeight: '18px' }}>
            {desc}
          </span>
        </div>
        {selected && (
          <span style={{ color: 'var(--semi-color-primary)', fontSize: 16, marginTop: 2 }}>✓</span>
        )}
      </div>
    );
  };

  const removeSlot = onRemove ? (
    <div
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        color: 'var(--semi-color-danger)',
        fontSize: 14,
      }}
      onClick={onRemove}
    >
      {t('collaborator.actions.remove')}
    </div>
  ) : undefined;

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as CollaboratorRole)}
      disabled={disabled}
      size={size}
      style={{ width: 100 }}
      renderOptionItem={renderOptionItem}
      renderSelectedItem={(optionNode) => {
        const role = (optionNode as { value: string }).value;
        return t(`collaborator.roles.${role}`) as unknown as React.ReactNode;
      }}
      dropdownStyle={{ width: 260 }}
      outerBottomSlot={removeSlot}
    >
      {availableRoles.map((role) => (
        <Select.Option key={role} value={role} label={t(`collaborator.roles.${role}`)}>
          {t(`collaborator.roles.${role}`)}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CollaboratorRoleSelect;
