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
      className="semi-select-option"
      onClick={onRemove}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRemove();
        }
      }}
    >
      <span className="semi-select-option-text" style={{ color: 'var(--semi-color-danger)' }}>
        {t('collaborator.actions.remove')}
      </span>
    </div>
  ) : undefined;

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as CollaboratorRole)}
      disabled={disabled}
      size={size}
      style={{ width: 100 }}
      dropdownStyle={{ width: 280 }}
      outerBottomSlot={removeSlot}
      renderSelectedItem={(optionNode) => {
        const role = (optionNode as { value: string }).value;
        return t(`collaborator.roles.${role}`) as unknown as React.ReactNode;
      }}
      renderOptionItem={({ disabled: optDisabled, selected, label, value: optValue, ...rest }) => (
        <div
          className={`semi-select-option${selected ? ' semi-select-option-selected' : ''}${optDisabled ? ' semi-select-option-disabled' : ''}`}
          style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 12px', cursor: optDisabled ? 'not-allowed' : 'pointer' }}
          onClick={() => !optDisabled && rest.onMouseEnter && onChange(optValue as CollaboratorRole)}
          {...rest}
        >
          <div style={{ width: 20, flexShrink: 0, marginTop: 2 }}>
            {selected && <span className="semi-select-option-icon semi-select-option-icon-tick" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span>{label}</span>
            <Text size="small" type="tertiary" style={{ lineHeight: '18px' }}>
              {t(`collaborator.roleDesc.${optValue}`)}
            </Text>
          </div>
        </div>
      )}
    >
      {availableRoles.map((role) => (
        <Select.Option key={role} value={role} label={t(`collaborator.roles.${role}`)} showTick={false} />
      ))}
    </Select>
  );
};

export default CollaboratorRoleSelect;
