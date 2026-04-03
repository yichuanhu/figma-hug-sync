import { useTranslation } from 'react-i18next';
import { Select, Divider } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
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
      disabled={disabled}
      size={size}
      style={{ width: 100 }}
      dropdownStyle={{ width: 260 }}
      outerBottomSlot={removeSlot}
    >
      {availableRoles.map((role) => (
        <Select.Option key={role} value={role}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>{t(`collaborator.roles.${role}`)}</span>
            <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)' }}>
              {t(`collaborator.roleDesc.${role}`)}
            </span>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default CollaboratorRoleSelect;
