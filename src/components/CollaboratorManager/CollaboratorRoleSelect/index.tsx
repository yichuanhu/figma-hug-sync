import { useTranslation } from 'react-i18next';
import { Select } from '@douyinfe/semi-ui';
import { IconCheckStroked } from '@douyinfe/semi-icons';
import type { CollaboratorRole, CollaboratorAssetType } from '@/api/index';
import { ASSET_AVAILABLE_ROLES } from '@/api/index';

import './index.less';

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
    const { selected, value: optValue, focused, onMouseEnter, onClick, style, className } = renderProps;
    const desc = t(`collaborator.roleDesc.${optValue}`);

    return (
      <div
        className={`collaborator-role-option ${className || ''} ${focused ? 'collaborator-role-option-focused' : ''} ${selected ? 'collaborator-role-option-selected' : ''}`}
        style={style}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <div className="collaborator-role-option-content">
          <span className="collaborator-role-option-label">
            {t(`collaborator.roles.${optValue}`)}
          </span>
          <span className="collaborator-role-option-desc">
            {desc}
          </span>
        </div>
        {selected && (
          <IconTickStroked className="collaborator-role-option-check" />
        )}
      </div>
    );
  };

  const removeSlot = onRemove ? (
    <div className="collaborator-role-remove" onClick={onRemove}>
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
