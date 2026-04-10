import { useTranslation } from 'react-i18next';
import { TreeSelect } from '@douyinfe/semi-ui';
import { departmentTree } from '@/mocks/departmentData';

interface DepartmentSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const DepartmentSelect = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  className,
}: DepartmentSelectProps) => {
  const { t } = useTranslation();

  return (
    <TreeSelect
      value={value}
      onChange={(val) => onChange?.(val as string)}
      treeData={departmentTree}
      placeholder={placeholder || t('common.owningDepartmentPlaceholder')}
      disabled={disabled}
      filterTreeNode
      searchAutoFocus
      searchPosition="dropdown"
      showSearchClear
      style={{ width: '100%', ...style }}
      className={className}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
    />
  );
};

export default DepartmentSelect;
