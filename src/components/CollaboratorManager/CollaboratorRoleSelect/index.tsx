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
}

const CollaboratorRoleSelect = ({
  value,
  onChange,
  assetType,
  disabled = false,
  size = 'small',
}: CollaboratorRoleSelectProps) => {
  const { t } = useTranslation();

  const availableRoles = ASSET_AVAILABLE_ROLES[assetType] || ['MANAGER', 'MAINTAINER', 'USER', 'OBSERVER'];

  const roleOptions = availableRoles.map((role) => ({
    value: role,
    label: t(`collaborator.roles.${role}`),
  }));

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as CollaboratorRole)}
      optionList={roleOptions}
      disabled={disabled}
      size={size}
      style={{ width: 100 }}
    />
  );
};

export default CollaboratorRoleSelect;
