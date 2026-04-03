import { useTranslation } from 'react-i18next';
import { Select, Typography } from '@douyinfe/semi-ui';
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

  const removeSlot = onRemove ? (
    <div
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        color: 'var(--semi-color-danger)',
        fontSize: 14,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--semi-color-fill-0)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
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
      dropdownStyle={{ width: 260 }}
      outerBottomSlot={removeSlot}
      renderSelectedItem={(optionNode) => {
        const role = (optionNode as { value: string }).value;
        return t(`collaborator.roles.${role}`) as unknown as React.ReactNode;
      }}
    >
      {availableRoles.map((role) => (
        <Select.Option key={role} value={role} label={t(`collaborator.roles.${role}`)} showTick>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>{t(`collaborator.roles.${role}`)}</span>
            <Text size="small" type="tertiary" style={{ fontSize: 12, lineHeight: '18px' }}>
              {t(`collaborator.roleDesc.${role}`)}
            </Text>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default CollaboratorRoleSelect;
